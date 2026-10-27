import { Component, HostListener, Input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  LucideArrowDown,
  LucideCalculator,
  LucideChevronRight,
  LucideFactory,
  LucideInfo,
  LucideLeaf,
  LucideMaximize2,
  LucideMinimize2,
  LucidePackage,
  LucideRecycle,
  LucideTruck,
  LucideX,
} from '@lucide/angular';
import { PITCH_SLIDES } from './carbon-benefits.data';
import { MapPickerComponent } from './map-picker/map-picker.component';
import {
  DEFAULT_PRODUCTION_PLANT,
  DESTINATION_COUNTRIES,
  GeoLocation,
  ROUTE_DETOUR_FACTOR,
  distanceKm,
} from './shipping-locations.data';

export interface CarbonFootprintRow {
  label: string;
  value: string;
}

type MaterialOption = 'virgin' | 'pcr-30' | 'pcr-50' | 'pcr-100';

interface WorldCityRecord {
  name: string;
  lat: string;
  lng: string;
  country: string;
}

const MATERIAL_FACTORS: Record<MaterialOption, number> = {
  virgin: 1,
  'pcr-30': 0.91,
  'pcr-50': 0.85,
  'pcr-100': 0.7,
};

const RENEWABLE_ENERGY_FACTOR = 0.75;


@Component({
  selector: 'app-carbon-footprint',
  standalone: true,
  imports: [
    DecimalPipe,
    MapPickerComponent,
    LucideArrowDown,
    LucideCalculator,
    LucideChevronRight,
    LucideFactory,
    LucideInfo,
    LucideLeaf,
    LucideMaximize2,
    LucideMinimize2,
    LucidePackage,
    LucideRecycle,
    LucideTruck,
    LucideX,
  ],
  templateUrl: './carbon-footprint.component.html',
  styleUrl: './carbon-footprint.component.css',
})
export class CarbonFootprintComponent {
  @Input() rows: CarbonFootprintRow[] = [];

  readonly material = signal<MaterialOption>('virgin');
  readonly renewableEnergySite = signal(false);
  readonly orderVolume = signal(10000);
  readonly assumptionsOpen = signal(false);
  readonly assumptionsMaximized = signal(false);
  readonly benefitsOpen = signal(false);
  readonly slideIndex = signal(0);

  readonly slides = PITCH_SLIDES;

  readonly materialLabel = computed(() => {
    const labels: Record<MaterialOption, string> = {
      virgin: 'Virgin plastic',
      'pcr-30': '30% PCR plastic',
      'pcr-50': '50% PCR plastic',
      'pcr-100': '100% PCR plastic',
    };
    return labels[this.material()];
  });

  readonly baseManufacturingEmissions = 0.28;

  readonly materialFactor = computed(() => MATERIAL_FACTORS[this.material()]);

  readonly energyFactor = computed(() => (this.renewableEnergySite() ? RENEWABLE_ENERGY_FACTOR : 1));

  readonly manufacturingEmissions = computed(
    () => this.baseManufacturingEmissions * this.materialFactor() * this.energyFactor()
  );

  readonly productionPlant = signal<GeoLocation>(DEFAULT_PRODUCTION_PLANT);

  @Input() set plant(value: GeoLocation | null | undefined) {
    this.productionPlant.set(value ?? DEFAULT_PRODUCTION_PLANT);
  }

  readonly countries = signal(DESTINATION_COUNTRIES.map(({ code, name }) => ({ code, name })));
  readonly destinationCountryCode = signal(DESTINATION_COUNTRIES[0].code);
  readonly destinationCity = signal<GeoLocation>(DESTINATION_COUNTRIES[0].cities[0]);
  readonly destinationCityCountryCode = signal(DESTINATION_COUNTRIES[0].code);
  readonly citySearch = signal('');
  readonly cityDataLoading = signal(false);
  readonly cityDataError = signal(false);

  readonly matchingCities = computed(() => {
    const query = this.citySearch().trim().toLocaleLowerCase();
    if (query.length < 2) return [];
    if (
      this.destinationCityCountryCode() === this.destinationCountryCode() &&
      query === this.destinationCity().name.toLocaleLowerCase()
    ) {
      return [];
    }
    return (this.worldCitiesByCountry[this.destinationCountryCode()] ?? [])
      .filter((city) => city.name.toLocaleLowerCase().includes(query))
      .slice(0, 12);
  });

  readonly destinationCountry = computed(
    () => this.countries().find((country) => country.code === this.destinationCountryCode()) ?? this.countries()[0]
  );
  readonly mapDestination = signal<GeoLocation | null>(null);
  readonly mapPickerOpen = signal(false);
  readonly destinationMode = signal<'list' | 'map'>('list');
  readonly destination = computed(() =>
    this.destinationMode() === 'map' && this.mapDestination() ? this.mapDestination()! : this.destinationCity()
  );
  readonly destinationLabel = computed(() =>
    this.destination() === this.mapDestination()
      ? this.mapDestination()!.name
      : `${this.destinationCity().name}, ${this.destinationCountry().name}`
  );

  // 0.09 kg CO2e per unit at the 500 km reference distance.
  readonly transportationFactorPerKm = 0.00018;
  readonly routeDetourFactor = ROUTE_DETOUR_FACTOR;
  readonly transportationDistance = computed(() =>
    Math.round(distanceKm(this.productionPlant(), this.destination()) * ROUTE_DETOUR_FACTOR)
  );

  private worldCitiesByCountry: Record<string, GeoLocation[]> = {};
  private cityDataLoaded = false;
  private cityDataPromise?: Promise<void>;

  readonly transportationEmissions = computed(
    () => this.transportationFactorPerKm * Math.max(this.transportationDistance(), 0)
  );
  readonly endOfLifeEmissions = 0.05;

  readonly emissionsPerUnit = computed(
    () => this.manufacturingEmissions() + this.transportationEmissions() + this.endOfLifeEmissions
  );

  readonly standardEmissionsPerUnit = computed(
    () => this.baseManufacturingEmissions + this.transportationEmissions() + this.endOfLifeEmissions
  );

  readonly standardTotalEmissions = computed(
    () => this.standardEmissionsPerUnit() * Math.max(this.orderVolume(), 0)
  );

  readonly avoidedEmissions = computed(() => Math.max(this.standardTotalEmissions() - this.totalEmissions(), 0));

  readonly comparisonInTonnes = computed(
    () => this.standardTotalEmissions() >= 1000 || this.totalEmissions() >= 1000
  );

  readonly displayedStandardTotal = computed(() =>
    this.comparisonInTonnes() ? this.standardTotalEmissions() / 1000 : this.standardTotalEmissions()
  );

  readonly displayedComparisonTotal = computed(() =>
    this.comparisonInTonnes() ? this.totalEmissions() / 1000 : this.totalEmissions()
  );

  readonly displayedAvoidedEmissions = computed(() =>
    this.comparisonInTonnes() ? this.avoidedEmissions() / 1000 : this.avoidedEmissions()
  );

  readonly reductionPercent = computed(() =>
    this.standardTotalEmissions() > 0 ? (this.avoidedEmissions() / this.standardTotalEmissions()) * 100 : 0
  );

  readonly manufacturingShare = computed(() => (this.manufacturingEmissions() / this.emissionsPerUnit()) * 100);
  readonly transportationShare = computed(() => (this.transportationEmissions() / this.emissionsPerUnit()) * 100);
  readonly endOfLifeShare = computed(() => (this.endOfLifeEmissions / this.emissionsPerUnit()) * 100);

  readonly totalEmissions = computed(
    () => this.emissionsPerUnit() * Math.max(this.orderVolume(), 0)
  );

  readonly displayInTonnes = computed(() => this.totalEmissions() >= 1000);
  readonly displayedTotalEmissions = computed(() =>
    this.displayInTonnes() ? this.totalEmissions() / 1000 : this.totalEmissions()
  );

  updateMaterial(event: Event): void {
    this.material.set((event.target as HTMLSelectElement).value as MaterialOption);
  }

  updateRenewableEnergySite(event: Event): void {
    this.renewableEnergySite.set((event.target as HTMLInputElement).checked);
  }

  updateOrderVolume(event: Event): void {
    this.orderVolume.set(this.readNumber(event));
  }

  updateDestinationCountry(event: Event): void {
    const countryCode = (event.target as HTMLSelectElement).value;
    this.destinationCountryCode.set(countryCode);
    this.citySearch.set('');
    this.destinationCityCountryCode.set('');
    const firstCity = this.worldCitiesByCountry[countryCode]?.[0];
    if (firstCity) {
      this.destinationCity.set(firstCity);
      this.destinationCityCountryCode.set(countryCode);
    }
  }

  updateCitySearch(event: Event): void {
    this.citySearch.set((event.target as HTMLInputElement).value);
  }

  selectDestinationCity(city: GeoLocation): void {
    this.destinationCity.set(city);
    this.destinationCityCountryCode.set(this.destinationCountryCode());
    this.citySearch.set(city.name);
  }

  loadCityData(): void {
    if (this.cityDataLoaded || this.cityDataPromise) return;

    this.cityDataLoading.set(true);
    this.cityDataError.set(false);
    this.cityDataPromise = this.loadWorldCities();
  }

  private async loadWorldCities(): Promise<void> {
    try {
      const module: unknown = await import('cities.json');
      const records = Array.isArray(module)
        ? module as WorldCityRecord[]
        : (module as { default: WorldCityRecord[] }).default;
      const citiesByCountry: Record<string, GeoLocation[]> = {};

      for (const record of records) {
        const lat = Number(record.lat);
        const lng = Number(record.lng);
        const countryCode = record.country.toUpperCase();
        if (!record.name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        (citiesByCountry[countryCode] ??= []).push({ name: record.name, lat, lng });
      }

      this.worldCitiesByCountry = citiesByCountry;
      const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const countries = Object.keys(citiesByCountry)
        .map((code) => ({ code, name: countryNames.of(code) ?? code }))
        .sort((left, right) => left.name.localeCompare(right.name));
      this.countries.set(countries);
      this.cityDataLoaded = true;

      const selectedCountry = this.destinationCountryCode();
      if (this.destinationCityCountryCode() !== selectedCountry) {
        const firstCity = citiesByCountry[selectedCountry]?.[0];
        if (firstCity) {
          this.destinationCity.set(firstCity);
          this.destinationCityCountryCode.set(selectedCountry);
        }
      }
    } catch {
      this.cityDataError.set(true);
    } finally {
      this.cityDataLoading.set(false);
      this.cityDataPromise = undefined;
    }
  }

  setDestinationMode(mode: 'list' | 'map'): void {
    this.destinationMode.set(mode);
    if (mode === 'map' && !this.mapDestination()) {
      this.openMapPicker();
    }
  }

  openMapPicker(): void {
    this.mapPickerOpen.set(true);
  }

  closeMapPicker(): void {
    this.mapPickerOpen.set(false);
    // Nothing was picked, so fall back to the dropdowns.
    if (!this.mapDestination()) {
      this.destinationMode.set('list');
    }
  }

  useMapDestination(point: GeoLocation): void {
    this.mapDestination.set(point);
    this.closeMapPicker();
  }

  openAssumptions(): void {
    this.assumptionsMaximized.set(false);
    this.assumptionsOpen.set(true);
  }

  closeAssumptions(): void {
    this.assumptionsOpen.set(false);
    this.assumptionsMaximized.set(false);
  }

  toggleAssumptionsMaximized(): void {
    this.assumptionsMaximized.update((maximized) => !maximized);
  }

  openBenefits(): void {
    this.slideIndex.set(0);
    this.benefitsOpen.set(true);
  }

  closeBenefits(): void {
    this.benefitsOpen.set(false);
  }

  nextSlide(): void {
    this.slideIndex.update((i) => Math.min(i + 1, this.slides.length - 1));
  }

  previousSlide(): void {
    this.slideIndex.update((i) => Math.max(i - 1, 0));
  }

  goToSlide(index: number): void {
    this.slideIndex.set(index);
  }

  @HostListener('document:keydown.escape')
  closeModalsOnEscape(): void {
    this.closeAssumptions();
    this.closeBenefits();
    this.closeMapPicker();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (this.benefitsOpen()) this.nextSlide();
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (this.benefitsOpen()) this.previousSlide();
  }

  private readNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }
}
