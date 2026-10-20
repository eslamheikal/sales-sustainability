import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductsService } from './products.service';

interface FilterGroup {
  id: string;
  label: string;
  options: string[];
}

const PAGE_SIZE = 15;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  readonly placeholderImage = 'assets/product_placeholder.png';
  readonly pageSize = PAGE_SIZE;

  allProducts = signal<Product[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  selectedCategories = signal<Set<string>>(new Set());
  selectedMarkets = signal<Set<string>>(new Set());
  expandedFilters = signal<Set<string>>(new Set(['product-solution']));
  currentPage = signal(1);

  filterGroups = computed<FilterGroup[]>(() => {
    const products = this.allProducts();
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean) as string[])].sort();

    return [
      { id: 'market', label: 'MARKET', options: this.extractMarkets(products) },
      { id: 'product-solution', label: 'PRODUCT SOLUTION', options: categories },
      { id: 'features', label: 'FEATURES & TECHNOLOGIES', options: [] },
      { id: 'regions', label: 'REGIONS', options: [] }
    ];
  });

  filteredProducts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selected = this.selectedCategories();
    const markets = this.selectedMarkets();

    return this.allProducts().filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);

      const matchesCategory =
        selected.size === 0 || (product.category ? selected.has(product.category) : false);

      const matchesMarket =
        markets.size === 0 || this.productMatchesMarkets(product, markets);

      return matchesSearch && matchesCategory && matchesMarket;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / PAGE_SIZE)));

  paginatedProducts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredProducts().slice(start, start + PAGE_SIZE);
  });

  showingFrom = computed(() => {
    const total = this.filteredProducts().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * PAGE_SIZE + 1;
  });

  showingTo = computed(() => {
    const total = this.filteredProducts().length;
    return Math.min(this.currentPage() * PAGE_SIZE, total);
  });

  ngOnInit(): void {
    this.productsService.getProducts().subscribe({
      next: (products) => {
        this.allProducts.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.error.set('Unable to load products. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  toggleFilterGroup(id: string): void {
    const expanded = new Set(this.expandedFilters());
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    this.expandedFilters.set(expanded);
  }

  isFilterExpanded(id: string): boolean {
    return this.expandedFilters().has(id);
  }

  toggleCategory(category: string, groupId: string): void {
    if (groupId === 'market') {
      const selected = new Set(this.selectedMarkets());
      if (selected.has(category)) {
        selected.delete(category);
      } else {
        selected.add(category);
      }
      this.selectedMarkets.set(selected);
    } else {
      const selected = new Set(this.selectedCategories());
      if (selected.has(category)) {
        selected.delete(category);
      } else {
        selected.add(category);
      }
      this.selectedCategories.set(selected);
    }
    this.currentPage.set(1);
  }

  isCategorySelected(category: string, groupId: string): boolean {
    return groupId === 'market'
      ? this.selectedMarkets().has(category)
      : this.selectedCategories().has(category);
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }

  private productMatchesMarkets(product: Product, markets: Set<string>): boolean {
    const text = `${product.name ?? ''} ${product.description ?? ''} ${product.category ?? ''}`.toLowerCase();
    return [...markets].some((market) => text.includes(market.toLowerCase()));
  }

  private extractMarkets(products: Product[]): string[] {
    const keywords = ['Beauty', 'Pharma', 'Food', 'Beverage', 'Home Care', 'Personal Care'];
    const found = new Set<string>();

    for (const product of products) {
      const text = `${product.name ?? ''} ${product.description ?? ''} ${product.category ?? ''}`.toLowerCase();
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          found.add(keyword);
        }
      }
    }

    return [...found].sort();
  }
}
