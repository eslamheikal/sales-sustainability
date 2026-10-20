import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'fs/promises';
import path from 'path';
import { DatabaseService } from './services/database.service';
import { Product, ProductAttributes, ProductSolutions } from './models/product.model';

interface ProductEmbeddingSeed {
    product_id: string;
    content: string;
    embedding: number[];
}

async function readSeedFile<T>(fileName: string): Promise<T[]> {
    const filePath = path.resolve(__dirname, 'db', fileName);
    return JSON.parse(await readFile(filePath, 'utf8')) as T[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const [products, embeddings] = await Promise.all([
            readSeedFile<Product>('products.json'),
            readSeedFile<ProductEmbeddingSeed>('product-embeddings.json')
        ]);

        const productIds = new Set(products.map(product => product.id));
        const invalidEmbedding = embeddings.find(embedding =>
            !productIds.has(embedding.product_id) || embedding.embedding.length !== 1536
        );

        if (invalidEmbedding) {
            return res.status(400).json({
                error: `Invalid embedding seed data for product ${invalidEmbedding.product_id}`
            });
        }

        await DatabaseService.initializeSchema();
        const client = await DatabaseService.getClient();

        try {
            await client.query('BEGIN');

            for (const product of products) {
                await client.query(
                    `INSERT INTO products (id, name, description, attributes, solutions, category, image_url)
                     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
                     ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        attributes = EXCLUDED.attributes,
                        solutions = EXCLUDED.solutions,
                        category = EXCLUDED.category,
                        image_url = EXCLUDED.image_url,
                        updated_at = CURRENT_TIMESTAMP`,
                    [
                        product.id,
                        product.name ?? null,
                        product.description ?? null,
                        JSON.stringify(product.attributes ?? {} as ProductAttributes),
                        JSON.stringify(product.solutions ?? {} as ProductSolutions),
                        product.category ?? null,
                        product.image_url ?? null
                    ]
                );
            }

            for (const embedding of embeddings) {
                await client.query(
                    `INSERT INTO product_embeddings (product_id, content, embedding)
                     VALUES ($1, $2, $3::vector)
                     ON CONFLICT (product_id) DO UPDATE SET
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding`,
                    [embedding.product_id, embedding.content, `[${embedding.embedding.join(',')}]`]
                );
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return res.status(200).json({
            message: 'Products and embeddings seeded successfully',
            products: products.length,
            embeddings: embeddings.length
        });
    } catch (error: any) {
        console.error('Seed API error:', error);
        return res.status(500).json({ error: 'Failed to seed products', details: error.message });
    }
}