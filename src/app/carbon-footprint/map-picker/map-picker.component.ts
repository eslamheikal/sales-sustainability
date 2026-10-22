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
import { GeoLocation } from '../shipping-locations.data';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [],
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

  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private destinationMarker?: Leaflet.CircleMarker;
  private routeLine?: Leaflet.Polyline;
  private placeLookup?: AbortController;
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
      this.setPoint({ name: `Map point (${lat.toFixed(2)}, ${lng.toFixed(2)})`, lat, lng });
      this.lookUpPlaceName(lat, lng);
    });

    // The map is created inside a modal that is still sizing itself.
    setTimeout(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.placeLookup?.abort();
    this.map?.remove();
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
