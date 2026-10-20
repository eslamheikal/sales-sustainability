export interface ChatResponse {
    messageId: string;
    blocks: Array<{
        kind: string;
        text?: string;
        url?: string;
        alt?: string;
        href?: string;
        label?: string;
        title?: string;
        snippet?: string;
        score?: number;
        spec?: any;
    }>;
    citations?: Array<{
        title?: string;
        score?: number;
    }>;
    suggestions?: string[];
    products?: Array<{
        title: string;
        heroImageUrl?: string;
        specs?: Array<{
            label: string;
            value: string;
        }>;
    }>;
}