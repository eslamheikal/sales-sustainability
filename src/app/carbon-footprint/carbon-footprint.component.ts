import { Component, HostListener, Input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BENEFIT_SLIDES } from './carbon-benefits.data';

export interface CarbonFootprintRow {
  label: string;
  value: string;
}

type MaterialOption = 'virgin' | 'pcr-30' | 'pcr-50' | 'pcr-100';

@Component({
  selector: 'app-carbon-footprint',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './carbon-footprint.component.html',
  styleUrl: './carbon-footprint.component.css',
})
export class CarbonFootprintComponent {
  @Input() rows: CarbonFootprintRow[] = [];

  readonly baselineEmissionsPerUnit = 0.42;
  readonly material = signal<MaterialOption>('virgin');
  readonly renewableEnergySite = signal(false);
  readonly orderVolume = signal(10000);
  readonly assumptionsOpen = signal(false);
  readonly benefitsOpen = signal(false);
  readonly slideIndex = signal(0);
  readonly reportView = signal(false);

  readonly slides = BENEFIT_SLIDES;

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

  readonly materialFactor = computed(() => {
    const materialFactors: Record<MaterialOption, number> = {
      virgin: 1,
      'pcr-30': 0.91,
      'pcr-50': 0.85,
      'pcr-100': 0.7,
    };
    return materialFactors[this.material()];
  });

  readonly energyFactor = computed(() => (this.renewableEnergySite() ? 0.75 : 1));

  readonly manufacturingEmissions = computed(
    () => this.baseManufacturingEmissions * this.materialFactor() * this.energyFactor()
  );

  readonly defaultTransportationDistanceKm = 500;
  // 0.09 kg CO2e per unit at the 500 km reference distance.
  readonly transportationFactorPerKm = 0.00018;
  readonly transportationDistance = signal(this.defaultTransportationDistanceKm);

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

  updateTransportationDistance(event: Event): void {
    this.transportationDistance.set(this.readNumber(event));
  }

  openAssumptions(): void {
    this.assumptionsOpen.set(true);
  }

  closeAssumptions(): void {
    this.assumptionsOpen.set(false);
  }

  openBenefits(): void {
    this.slideIndex.set(0);
    this.reportView.set(false);
    this.benefitsOpen.set(true);
  }

  toggleReportView(): void {
    this.reportView.update((v) => !v);
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
