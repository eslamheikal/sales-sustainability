import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory (development only)
// Vercel automatically loads environment variables from dashboard
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export class EmbeddingService {
    private static embeddings: OpenAIEmbeddings | undefined;

    static async getEmbeddings(): Promise<OpenAIEmbeddings> {
        if (!EmbeddingService.embeddings) {
            const apiKey = process.env.OPENAI_API_KEY;
            
            if (!apiKey) {
                throw new Error('OPENAI_API_KEY is not set in environment variables');
            }

            EmbeddingService.embeddings = new OpenAIEmbeddings({
                modelName: 'text-embedding-3-small',
                openAIApiKey: apiKey,
                dimensions: 1536, // Use smaller dimensions for cost efficiency
            });
        }
        return EmbeddingService.embeddings;
    }

    static async embedText(text: string): Promise<number[]> {
        const embeddings = await EmbeddingService.getEmbeddings();
        return await embeddings.embedQuery(text);
    }

    static async embedTexts(texts: string[]): Promise<number[][]> {
        const embeddings = await EmbeddingService.getEmbeddings();
        const result = await embeddings.embedDocuments(texts);
        return result;
    }
}
