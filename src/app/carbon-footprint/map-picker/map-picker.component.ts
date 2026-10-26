import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import { LucideSearch } from '@lucide/angular';
import { GeoLocation } from '../shipping-locations.data';

interface PlaceSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [LucideSearch],
  templateUrl: './map-picker.component.html',
  styleUrl: './map-picker.component.css',
})
export class MapPickerComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) plant!: GeoLocation;
  @Input() destination: GeoLocation | null = null;
  @Output() picked = new EventEmitter<GeoLocation>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('mapContainer', { static: true }) private mapContainer!: ElementRef<HTMLDivElement>;

  readonly pendingPoint = signal<GeoLocation | null>(null);
  readonly lookingUpPlace = signal(false);
  readonly mapReady = signal(false);
  readonly placeQuery = signal('');
  readonly searchResults = signal<GeoLocation[]>([]);
  readonly searchingPlaces = signal(false);
  readonly placeSearchError = signal<string | null>(null);

  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private destinationMarker?: Leaflet.CircleMarker;
  private routeLine?: Leaflet.Polyline;
  private placeLookup?: AbortController;
  private placeSearchLookup?: AbortController;
  private nominatimRequestQueue: Promise<void> = Promise.resolve();
  private lastNominatimRequestAt = 0;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    // Loaded on demand to keep Leaflet out of the initial bundle.
    const leafletModule = await import('leaflet');
    const L = ((leafletModule as { default?: typeof Leaflet }).default ?? leafletModule) as typeof Leaflet;
    if (this.destroyed) return;
    this.L = L;

    const plantLatLng = L.latLng(this.plant.lat, this.plant.lng);

    this.map = L.map(this.mapContainer.nativeElement, { worldCopyJump: true }).setView(plantLatLng, 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    L.circleMarker(plantLatLng, { radius: 8, color: '#1f4e79', fillColor: '#1f4e79', fillOpacity: 0.9 })
      .bindTooltip(this.plant.name, { permanent: true, direction: 'top', offset: [0, -8] })
      .addTo(this.map);

    if (this.destination) {
      this.setPoint(this.destination);
    }

    this.map.on('click', (event: Leaflet.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng.wrap();
      this.placeSearchLookup?.abort();
      this.searchingPlaces.set(false);
      this.searchResults.set([]);
      this.placeSearchError.set(null);
      this.setPoint({ name: `Map point (${lat.toFixed(2)}, ${lng.toFixed(2)})`, lat, lng });
      this.lookUpPlaceName(lat, lng);
    });

    this.mapReady.set(true);

    // The map is created inside a modal that is still sizing itself.
    setTimeout(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.placeLookup?.abort();
    this.placeSearchLookup?.abort();
    this.map?.remove();
  }

  updatePlaceQuery(event: Event): void {
    this.placeQuery.set((event.target as HTMLInputElement).value);
    this.placeSearchLookup?.abort();
    this.searchingPlaces.set(false);
    this.searchResults.set([]);
    this.placeSearchError.set(null);
  }

  async searchPlace(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const query = this.placeQuery().trim();
    if (query.length < 2 || !this.mapReady()) return;

    this.placeSearchLookup?.abort();
    const lookup = new AbortController();
    this.placeSearchLookup = lookup;
    this.searchingPlaces.set(true);
    this.placeSearchError.set(null);
    this.searchResults.set([]);

    try {
      if (!(await this.waitForNominatimSlot(lookup.signal))) return;
      const url =
        'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en' +
        `&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { signal: lookup.signal });
      if (!response.ok) throw new Error('Place search failed');

      const results = (await response.json()) as PlaceSearchResult[];
      if (lookup.signal.aborted) return;

      const places = results
        .map((result): GeoLocation | null => {
          const lat = Number(result.lat);
          const lng = Number(result.lon);
          if (!result.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return { name: this.formatPlaceName(result.address) ?? result.display_name, lat, lng };
        })
        .filter((place): place is GeoLocation => place !== null);

      this.searchResults.set(places);
      if (!places.length) this.placeSearchError.set('No matching places found. Try a nearby city or address.');
    } catch {
      if (!lookup.signal.aborted) this.placeSearchError.set('Place search is unavailable right now. Please try again.');
    } finally {
      if (this.placeSearchLookup === lookup) this.searchingPlaces.set(false);
    }
  }

  selectSearchResult(point: GeoLocation): void {
    this.setPoint(point);
    this.map?.flyTo([point.lat, point.lng], Math.max(this.map.getZoom(), 10), { duration: 0.45 });
    this.searchResults.set([]);
  }

  confirm(): void {
    const point = this.pendingPoint();
    if (point && !this.lookingUpPlace()) {
      this.picked.emit(point);
    }
  }

  close(): void {
    this.closed.emit();
  }

  private async lookUpPlaceName(lat: number, lng: number): Promise<void> {
    this.placeLookup?.abort();
    const lookup = new AbortController();
    this.placeLookup = lookup;
    this.lookingUpPlace.set(true);

    try {
      if (!(await this.waitForNominatimSlot(lookup.signal))) return;
      const url =
        'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en' +
        `&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, { signal: lookup.signal });
      if (!response.ok) return;

      const result = (await response.json()) as { address?: Record<string, string> };
      const name = this.formatPlaceName(result.address);
      const current = this.pendingPoint();
      if (name && current && current.lat === lat && current.lng === lng) {
        this.pendingPoint.set({ ...current, name });
      }
    } catch {
      // Keep the coordinate label if the lookup fails or is superseded.
    } finally {
      if (this.placeLookup === lookup) {
        this.lookingUpPlace.set(false);
      }
    }
  }

  private async waitForNominatimSlot(signal: AbortSignal): Promise<boolean> {
    const previousRequest = this.nominatimRequestQueue;
    let releaseRequest: () => void = () => {};
    this.nominatimRequestQueue = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    await previousRequest;
    try {
      if (signal.aborted || this.destroyed) return false;
      const waitMs = Math.max(0, 1000 - (Date.now() - this.lastNominatimRequestAt));
      if (waitMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
      if (signal.aborted || this.destroyed) return false;
      this.lastNominatimRequestAt = Date.now();
      return true;
    } finally {
      releaseRequest();
    }
  }

  private formatPlaceName(address?: Record<string, string>): string | null {
    if (!address) return null;
    const place =
      address['city'] ?? address['town'] ?? address['village'] ?? address['municipality'] ?? address['county'];
    const region = address['state'];
    const country = address['country'];
    const parts = [place, place ? null : region, country].filter((part): part is string => !!part);
    return parts.length ? parts.join(', ') : null;
  }

  private setPoint(point: GeoLocation): void {
    const L = this.L;
    if (!this.map || !L) return;

    this.pendingPoint.set(point);
    const latLng = L.latLng(point.lat, point.lng);

    this.destinationMarker?.remove();
    this.routeLine?.remove();

    this.destinationMarker = L.circleMarker(latLng, {
      radius: 8,
      color: '#2e7d32',
      fillColor: '#2e7d32',
      fillOpacity: 0.9,
    }).addTo(this.map);

    this.routeLine = L.polyline([[this.plant.lat, this.plant.lng], latLng], {
      color: '#2e7d32',
      weight: 2,
      dashArray: '6 6',
    }).addTo(this.map);
  }
}
