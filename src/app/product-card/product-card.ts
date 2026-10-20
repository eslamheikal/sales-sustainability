import { Component, Input, signal } from '@angular/core';
import { ProductCardModel } from './product-card.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {

  //#region Properties
  @Input() product!: ProductCardModel;
  @Input() placeholderImage = '/assets/product_placeholder.png';

  imageSrc = signal<string>('');
  safeSpecs = signal<{ label: string; value: string }[]>([]);
  //#endregion

  //#region Lifecycle
  ngOnInit(): void {
    this.imageSrc.set(this.product.heroImageUrl?.trim() || this.placeholderImage);
    this.safeSpecs.set((this.product.specs ?? []).slice(0, 3) as { label: string; value: string }[]);
  }
  //#endregion

  //#region Methods
  onImgError() {
    if (this.imageSrc() !== this.placeholderImage) {
      this.imageSrc.set(this.placeholderImage);
    }
  }

  trackByIdx = (_: number, __: unknown) => _;
  //#endregion
}
