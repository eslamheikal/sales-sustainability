import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarbonFootprintComponent, CarbonFootprintRow } from '../carbon-footprint/carbon-footprint.component';
import { Product } from '../models/product.model';
import { ProductsService } from '../products/products.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CarbonFootprintComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  readonly placeholderImage = 'assets/product_placeholder.png';

  readonly carbonFootprintRows: CarbonFootprintRow[] = [
    { label: 'Total carbon footprint', value: '0.42 kg CO2e per unit' },
    { label: 'Manufacturing', value: '0.28 kg CO2e' },
    { label: 'Transportation', value: '0.09 kg CO2e' },
    { label: 'Recycling / disposal', value: '0.05 kg CO2e' },
    { label: 'Recycled content', value: 'Up to 50% PCR' },
    { label: 'Assessment method', value: 'ISO 14040 / ISO 14044' },
  ];

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Product not found.');
      this.loading.set(false);
      return;
    }

    this.productsService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product:', err);
        this.error.set('Unable to load this product. It may no longer be available.');
        this.loading.set(false);
      }
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }

  specificationRows(product: Product): DetailRow[] {
    const attributes = this.buildSectionItems(product.attributes, [
      { key: 'target_market', label: 'Market' },
      { key: 'applications', label: 'Applications' },
      { key: 'materials', label: 'Materials' },
      { key: 'compliance_standards', label: 'Compliance' },
      { key: 'certifications', label: 'Certifications' },
      { key: 'technical_specs', label: 'Technical specs' },
      { key: 'dimensions', label: 'Dimensions' },
    ]);

    const solutions = this.buildSectionItems(product.solutions, [
      { key: 'primary_use', label: 'Primary use' },
      { key: 'use_cases', label: 'Use cases' },
      { key: 'industries', label: 'Industries' },
    ]);

    return [...attributes, ...solutions];
  }

  private buildSectionItems(
    record: Record<string, unknown> | undefined,
    fields: { key: string; label: string }[]
  ): DetailRow[] {
    if (!record) {
      return [];
    }

    const rows: DetailRow[] = [];

    for (const field of fields) {
      const value = this.formatValue(record[field.key]);
      if (value) {
        rows.push({ label: field.label, value });
      }
    }

    return rows;
  }

  private formatValue(value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (Array.isArray(value)) {
      const items = [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
      return items.length ? items.join(', ') : null;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'object') {
      const pairs = Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== null && entry !== undefined && entry !== '')
        .map(([key, entry]) => `${this.formatLabel(key)}: ${entry}`);

      return pairs.length ? pairs.join(', ') : null;
    }

    return null;
  }

  private formatLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

interface DetailRow {
  label: string;
  value: string;
}
