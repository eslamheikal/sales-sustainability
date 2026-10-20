export interface ProductAttributes {
    features?: string[];
    benefits?: string[];
    applications?: string[];
    compliance_standards?: string[];
    target_market?: string;
    technical_specs?: {
        [key: string]: any;
    };
    materials?: string[];
    dimensions?: {
        [key: string]: string;
    };
    certifications?: string[];
    [key: string]: any; // Allow additional properties
}

export interface ProductSolutions {
    primary_use?: string;
    key_benefits?: string[];
    technical_specs?: {
        [key: string]: any;
    };
    use_cases?: string[];
    industries?: string[];
    [key: string]: any; // Allow additional properties
}

export interface Product {
    id: string; // UUID
    name?: string;
    description?: string;
    image_url?: string;
    attributes?: ProductAttributes;
    solutions?: ProductSolutions;
    category?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ProductWithEmbedding extends Product {
    embedding?: number[];
    similarity?: number;
}

export interface ProductSearchResult {
    id: string;
    name?: string;
    description?: string;
    attributes?: ProductAttributes;
    solutions?: ProductSolutions;
    category?: string;
    image_url?: string;
    content: string; // Generated content for embedding
    similarity?: number;
}

export interface ProductContentInput {
    name?: string;
    description?: string;
    attributes?: ProductAttributes;
    solutions?: ProductSolutions;
    category?: string;
}
