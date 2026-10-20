export interface Product {
  id: string;
  name?: string;
  description?: string;
  image_url?: string;
  category?: string;
  attributes?: Record<string, unknown>;
  solutions?: Record<string, unknown>;
}

export interface ProductListResponse {
  products: Product[];
}

export interface ProductDetailResponse {
  product: Product;
}
