import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductDetailResponse, ProductListResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiUrl.replace(/\/$/, '');

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductListResponse>(`${this.apiBaseUrl}/api/products`).pipe(
      timeout(15000),
      map((response) =>
        (response.products ?? []).map((product) => this.normalizeProduct(product))
      ),
      catchError((error) =>
        throwError(() => new Error(error?.message || 'Failed to load products from API'))
      )
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<ProductDetailResponse>(`${this.apiBaseUrl}/api/product/${encodeURIComponent(id)}`).pipe(
      timeout(15000),
      map((response) => this.normalizeProduct(response.product)),
      catchError((error) =>
        throwError(() => new Error(error?.message || 'Failed to load product from API'))
      )
    );
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      id: String(product.id)
    };
  }
}
