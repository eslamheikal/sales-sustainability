import { Product } from './product.model';

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    details?: any;
}

export interface ProductListResponse {
    products: Product[];
}

export interface ProductCreateResponse {
    message: string;
    productId: string;
}

export interface InitResponse {
    message: string;
    timestamp: string;
}

export { Product } from './product.model';
