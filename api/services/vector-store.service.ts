import { DatabaseService } from './database.service';
import { EmbeddingService } from './embedding.service';
import { ProductSearchResult } from '../models/product.model';

export class VectorStoreService {

    // Create an embedding for a given text query
    static async createQueryEmbedding(query: string): Promise<number[]> {
        try {
            return await EmbeddingService.embedText(query);
        }
        catch (error) {
            console.error('Error creating query embedding:', error);
            throw error;
        }
    }

    // Search for similar products using a precomputed embedding
    static async searchSimilarProducts(
        embedding: number[],
        limit: number = 5,
        threshold: number = 0.7
    ): Promise<ProductSearchResult[]> {
        try {

            limit = limit < 1 ? 1 : limit;
            threshold = threshold > 1 ? 1 : threshold;
            threshold = threshold < -1 ? -1 : threshold;

            const sql = VectorStoreService.buildSimilaritySearchQuery();

            const overFetch = Math.max(limit * 2, limit);
            const vectorLiteral = `[${embedding.join(",")}]`;
            const params = [vectorLiteral, overFetch];

            const result = await DatabaseService.query(sql, params);

            const filtered = result.rows
                .map((row: any) => ({ ...row, similarity: 1 - row.distance }))
                .filter((r: any) => r.similarity >= threshold)
                .slice(0, limit);

            return filtered.map((row: any) => VectorStoreService.mapRowToSearchResult(row));
        } catch (error) {
            console.error('Error searching similar products:', error);
            throw error;
        }
    }

    // SQL builder for similarity search (cosine similarity using pgvector)
    private static buildSimilaritySearchQuery(): string {
        return `
            WITH ranked AS (
            SELECT
                p.id,
                p.name,
                p.description,
                p.attributes,
                p.solutions,
                p.category,
                p.image_url,
                (pe.embedding <=> $1::vector) AS distance
            FROM products p
            INNER JOIN product_embeddings pe ON pe.product_id = p.id
            ORDER BY distance ASC, p.id ASC
            LIMIT $2
            )
            SELECT * FROM ranked;
        `;
    }

    // Map a DB row to ProductSearchResult
    private static mapRowToSearchResult(row: any): ProductSearchResult {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            attributes: row.attributes,
            solutions: row.solutions,
            category: row.category,
            image_url: row.image_url,
            content: VectorStoreService.createResultContent(row),
            similarity: row.similarity
        };
    }

    // Fallback text-based search when pgvector is not available
    private static async fallbackTextSearch(
        embedding: number[],
        limit: number = 5
    ): Promise<ProductSearchResult[]> {
        try {
            // Simple text search as fallback
            const sql = `
                  SELECT p.id, p.name, p.description, p.attributes, p.solutions, p.category, p.image_url
                  FROM products p
                  INNER JOIN product_embeddings pe ON pe.product_id = p.id
                  ORDER BY p.id
                LIMIT $1
            `;
            
            const result = await DatabaseService.query(sql, [limit]);
            
            return result.rows.map((row: any) => ({
                ...VectorStoreService.mapRowToSearchResult(row),
                similarity: 0.5 // Default similarity for fallback
            }));
        } catch (error) {
            console.error('Error in fallback text search:', error);
            return [];
        }
    }

    // Build a readable content string for search results
    private static createResultContent(row: any): string {
        const parts = [
            row.name ? `Product: ${row.name}` : '',
            row.description ? `Description: ${row.description}` : '',
            row.category ? `Category: ${row.category}` : '',
            row.attributes ? `Attributes: ${JSON.stringify(row.attributes)}` : '',
            row.solutions ? `Solutions: ${JSON.stringify(row.solutions)}` : '',
            row.image_url ? `Image URL: ${row.image_url}` : ''
        ];
        return parts.filter((p: string) => p.trim() !== '').join('\n');
    }
}
