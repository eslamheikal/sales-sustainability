import { Component, HostListener, Input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
  imports: [DecimalPipe, MapPickerComponent],
  templateUrl: './carbon-footprint.component.html',
  styleUrl: './carbon-footprint.component.css',
})
export class CarbonFootprintComponent {
  @Input() rows: CarbonFootprintRow[] = [];

  readonly material = signal<MaterialOption>('virgin');
  readonly renewableEnergySite = signal(false);
  readonly orderVolume = signal(10000);
  readonly assumptionsOpen = signal(false);
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

  readonly countries = DESTINATION_COUNTRIES;
  readonly destinationCountryCode = signal(DESTINATION_COUNTRIES[0].code);
  readonly destinationCityName = signal(DESTINATION_COUNTRIES[0].cities[0].name);

  readonly destinationCountry = computed(
    () => DESTINATION_COUNTRIES.find((c) => c.code === this.destinationCountryCode()) ?? DESTINATION_COUNTRIES[0]
  );
  readonly destinationCity = computed(() => {
    const cities = this.destinationCountry().cities;
    return cities.find((c) => c.name === this.destinationCityName()) ?? cities[0];
  });
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

  readonly transportationEmissions = computed(
    () => this.transportationFactorPerKm * Math.max(this.transportationDistance(), 0)
  );
  readonly endOfLifeEmissions = 0.05;

  readonly emissionsPerUnit = computed(
    () => this.manufacturingEmissions() + this.transportationEmissions() + this.endOfLifeEmissions
  );

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
    this.destinationCountryCode.set((event.target as HTMLSelectElement).value);
    this.destinationCityName.set(this.destinationCountry().cities[0].name);
  }

  updateDestinationCity(event: Event): void {
    this.destinationCityName.set((event.target as HTMLSelectElement).value);
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
    this.assumptionsOpen.set(true);
  }

  closeAssumptions(): void {
    this.assumptionsOpen.set(false);
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
