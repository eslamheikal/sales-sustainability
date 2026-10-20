import { DatabaseService } from './database.service';
import { EmbeddingService } from './embedding.service';
import { Product, ProductContentInput } from '../models/product.model';

export class ProductDataService {
    // Add a product to the database with embedding
    static async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
        const client = await DatabaseService.getClient();
        try {
            const content = ProductDataService.createProductContent(product);
            const embedding = await EmbeddingService.embedText(content);
            await client.query('BEGIN');
            const productResult = await client.query(
                `INSERT INTO products (name, description, attributes, solutions, category)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [
                    product.name || null,
                    product.description || null,
                    product.attributes ? JSON.stringify(product.attributes) : null,
                    product.solutions ? JSON.stringify(product.solutions) : null,
                    product.category || null
                ]
            );

            await client.query(
                `INSERT INTO product_embeddings (product_id, content, embedding)
                 VALUES ($1, $2, $3)`,
                [productResult.rows[0].id, content, `[${embedding.join(',')}]`]
            );
            await client.query('COMMIT');
            return productResult.rows[0].id;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error adding product:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Get all products (for initial setup or debugging)
    static async getAllProducts(): Promise<Product[]> {
        const result = await DatabaseService.query(`
            SELECT id, name, description, attributes, solutions, category, image_url, created_at, updated_at
            FROM products
            ORDER BY name ASC NULLS LAST
        `);
        return result.rows;
    }

    static async getProductById(id: string): Promise<Product | null> {
        const result = await DatabaseService.query(`
            SELECT id, name, description, attributes, solutions, category, image_url, created_at, updated_at
            FROM products
            WHERE id = $1
        `, [id]);
        return result.rows[0] ?? null;
    }

    // Bulk add products (useful for initial data seeding)
    static async bulkAddProducts(products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]): Promise<string[]> {
        const productIds: string[] = [];
        for (const product of products) {
            try {
                const productId = await ProductDataService.addProduct(product);
                productIds.push(productId);
            } catch (error) {
                console.error(`Error adding product ${product.name || 'unknown'}:`, error);
            }
        }
        return productIds;
    }

    // Backfill missing embeddings for existing products
    static async backfillMissingEmbeddings(): Promise<number> {
        // 1. Fetch rows without embeddings
        const missing = await DatabaseService.query(`
            SELECT p.id, p.name, p.description, p.attributes, p.solutions, p.category
            FROM products p
            LEFT JOIN product_embeddings pe ON pe.product_id = p.id
            WHERE pe.product_id IS NULL
        `);

        if (!missing.rows || missing.rows.length === 0) {
            return 0;
        }

        let updatedCount = 0;
        for (const row of missing.rows) {
            const content = ProductDataService.createProductContent({
                name: row.name,
                description: row.description,
                attributes: row.attributes,
                solutions: row.solutions,
                category: row.category
            });

            // 2. Generate embedding
            const vector = await EmbeddingService.embedText(content);

            // 3. Store the generated embedding with its product
            await DatabaseService.query(
                `INSERT INTO product_embeddings (product_id, content, embedding)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id) DO UPDATE
                 SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
                [row.id, content, `[${vector.join(',')}]`]
            );
            updatedCount++;
        }

        return updatedCount;
    }

    // Create comprehensive content for embedding
    private static createProductContent(product: ProductContentInput): string {
        const parts = [
            product.name ? `Product: ${product.name}` : '',
            product.description ? `Description: ${product.description}` : '',
            product.category ? `Category: ${product.category}` : '',
            product.attributes ? `Attributes: ${JSON.stringify(product.attributes)}` : '',
            product.solutions ? `Solutions: ${JSON.stringify(product.solutions)}` : ''
        ];
        return parts.filter(part => part.trim() !== '').join('\n');
    }
}


