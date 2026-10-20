import { VectorStoreService } from './vector-store.service';
import { ProductDataService } from './product-data.service';
import { Product, ProductSearchResult } from '../models/product.model';
import { ChatMessage } from '../models/chat-message.model';
import { LlmService } from './llm.service';
import { ChatResponse } from '../models/chat-response.model';

export class RAGService {
    
    // Enhanced prompt method with RAG
    static async promptWithRAG(userPrompt: string): Promise<ChatResponse> {
        try {
            // Step 1: Create query embedding and retrieve relevant product information
            const queryEmbedding = await VectorStoreService.createQueryEmbedding(userPrompt);
                        
            const relevantProducts = await VectorStoreService.searchSimilarProducts(
                queryEmbedding,
                5, // Get top 5 most relevant products
                0.6 // Similarity threshold
            );

            // Step 2: Create context from retrieved products
            const context = RAGService.createContextFromProducts(relevantProducts);

            // Step 3: Enhance the user prompt with context
            const enhancedPrompt = RAGService.createEnhancedPrompt(userPrompt, context);

            // Step 4: Get response from LLM with enhanced context
            const llmService = new LlmService();
            const response = await llmService.prompt(enhancedPrompt);

            // Step 5: Add citations from retrieved products
            const responseWithCitations = RAGService.addCitationsToResponse(response, relevantProducts);

            return responseWithCitations;
        } 
        catch (error) {
            console.error('Error in RAG prompt:', error);
            const llmService = new LlmService();
            return await llmService.prompt(userPrompt);
        }
    }

    // Enhanced prompt method with history and RAG
    static async promptWithHistoryAndRAG(history: ChatMessage[]): Promise<ChatResponse> {
        try {
            // Get the latest user message for retrieval
            const latestUserMessage = this.getLatestUserMessage(history);

            // Step 1: Create query embedding and retrieve relevant product information
            const queryEmbedding = await VectorStoreService.createQueryEmbedding(latestUserMessage);
            const relevantProducts = await VectorStoreService.searchSimilarProducts(
                queryEmbedding,
                5, 
                0.6
            );

            // Step 2: Create context from retrieved products
            const context = RAGService.createContextFromProducts(relevantProducts);

            // Step 3: Enhance the latest user message with context
            const enhancedUserMessage = RAGService.createEnhancedPrompt(latestUserMessage, context);

            // Step 4: Update history with enhanced message
            const enhancedHistory = RAGService.enhanceHistoryWithContext(history, enhancedUserMessage);

            // Step 5: Get response from LLM with enhanced context
            const llmService = new LlmService();
            const response = await llmService.promptWithHistory(enhancedHistory);

            // Step 6: Add citations from retrieved products
            const responseWithCitations = RAGService.addCitationsToResponse(response, relevantProducts);

            return responseWithCitations;
        } 
        catch (error) {
            console.error('Error in RAG prompt with history:', error);
            // Fallback to regular LLM service if RAG fails
            const llmService = new LlmService();
            return await llmService.promptWithHistory(history);
        }
    }

    // Create context string from retrieved products
    private static createContextFromProducts(products: ProductSearchResult[]): string {
        if (products.length === 0) {
            return "No specific product information found for this query.";
        }

        const contextParts = [
            "RELEVANT PRODUCT INFORMATION:",
            "Based on your query, here are the most relevant Aptar products and solutions:"
        ];

        products.forEach((product, index) => {
            contextParts.push(`\n${index + 1}. ${product.name || 'Product'}`);
            
            if (product.category) {
                contextParts.push(`   Category: ${product.category}`);
            }
            
            if (product.description) {
                contextParts.push(`   Description: ${product.description}`);
            }
            
            if (product.attributes) {
                contextParts.push(`   Attributes: ${JSON.stringify(product.attributes)}`);
            }
            
            if (product.solutions) {
                contextParts.push(`   Solutions: ${JSON.stringify(product.solutions)}`);
            }
            
        });

        contextParts.push("\nPlease use this information to provide accurate, specific, and helpful responses about Aptar's products and solutions.");

        return contextParts.join('\n');
    }

    // Create enhanced prompt with context
    private static createEnhancedPrompt(userPrompt: string, context: string): string {
        return `${userPrompt}\n\n${context}`;
    }

    // Add citations to the response
    private static addCitationsToResponse(
        response: ChatResponse, 
        products: ProductSearchResult[]
    ): ChatResponse {
        if (products.length === 0) {
            return response;
        }

        // Create citations from retrieved products
        const citations = products.map(product => ({
            title: product.name || 'Aptar Product',
            score: product.similarity || 0.8
        }));

        // Add citations to response
        return {
            ...response,
            citations: [...(response.citations || []), ...citations]
        };
    }

    private static getLatestUserMessage(history: ChatMessage[]): string {
        return history
            .filter(msg => msg.role === 'user')
            .pop()?.content || '';
    }

    private static enhanceHistoryWithContext(history: ChatMessage[], enhancedUserMessage: string): ChatMessage[] {
        return history.map((msg, index) => {
            if (index === history.length - 1 && msg.role === 'user') {
                return { ...msg, content: enhancedUserMessage };
            }
            return msg;
        });
    }
}
