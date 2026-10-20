import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory (development only)
// Vercel automatically loads environment variables from dashboard
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export class DatabaseService {
    private static pool: Pool | undefined;

    static async init(): Promise<void> {
        if (!DatabaseService.pool) {
            const useSsl = process.env.POSTGRES_SSL === 'true';
            const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
            if (connectionString) {
                let databaseUrl: URL;
                try {
                    databaseUrl = new URL(connectionString);
                } catch {
                    throw new Error('Invalid DATABASE_URL or POSTGRES_URL: expected a PostgreSQL connection URL');
                }
                if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
                    throw new Error('Invalid DATABASE_URL or POSTGRES_URL: expected a PostgreSQL connection URL');
                }
            } else {
                const requiredVariables = ['POSTGRES_HOST', 'POSTGRES_NAME', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
                const missingVariables = requiredVariables.filter(name => !process.env[name]);
                if (missingVariables.length) {
                    throw new Error(`Missing database environment variables: ${missingVariables.join(', ')}`);
                }
            }

            const port = Number(process.env.POSTGRES_PORT || 5432);
            if (!connectionString && (!Number.isInteger(port) || port < 1 || port > 65535)) {
                throw new Error('Invalid POSTGRES_PORT: expected a port between 1 and 65535');
            }

            DatabaseService.pool = new Pool({
                ...(connectionString ? { connectionString } : {
                    host: process.env.POSTGRES_HOST,
                    port,
                    database: process.env.POSTGRES_NAME,
                    user: process.env.POSTGRES_USER,
                    password: process.env.POSTGRES_PASSWORD,
                }),
                ssl: useSsl ? { rejectUnauthorized: false } : false,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });

            try {
                // Test the connection
                const client = await DatabaseService.pool.connect();
                console.log('Connected to NeonDB PostgreSQL database');
                
                // Enable pgvector extension
                await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
                console.log('pgvector extension enabled');
                
                client.release();
            } catch (error) {
                console.error('Database connection error:', error);
                throw error;
            }
        }
    }

    static async query(text: string, params?: any[]): Promise<any> {
        await DatabaseService.init();
        
        if (!DatabaseService.pool) {
            throw new Error('Database pool not initialized');
        }

        try {
            const result = await DatabaseService.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    static async getClient(): Promise<PoolClient> {
        await DatabaseService.init();
        
        if (!DatabaseService.pool) {
            throw new Error('Database pool not initialized');
        }

        return await DatabaseService.pool.connect();
    }

    static async close(): Promise<void> {
        if (DatabaseService.pool) {
            await DatabaseService.pool.end();
            DatabaseService.pool = undefined;
            console.log('Database connection pool closed');
        }
    }

    // Initialize database schema
    static async initializeSchema(): Promise<void> {
        try {
            console.log('Initializing database schema...');

            await DatabaseService.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

            // Create products table with vector support
            await DatabaseService.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255),
                    description TEXT,
                    attributes JSONB,
                    solutions JSONB,
                    category VARCHAR(100),
                    image_url VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await DatabaseService.query(`
                CREATE TABLE IF NOT EXISTS product_embeddings (
                    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    embedding VECTOR(1536) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create index for vector similarity search
            await DatabaseService.query(`
                CREATE INDEX IF NOT EXISTS product_embeddings_embedding_idx 
                ON product_embeddings USING ivfflat (embedding vector_cosine_ops) 
                WITH (lists = 100);
            `);

            console.log('Database schema initialized successfully');
        } catch (error) {
            console.error('Error initializing database schema:', error);
            throw error;
        }
    }

    // Health check
    static async healthCheck(): Promise<boolean> {
        try {
            const result = await DatabaseService.query('SELECT 1');
            return result.rows.length > 0;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
}
