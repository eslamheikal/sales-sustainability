import { ChatOpenAI } from "@langchain/openai";
import dotenv from 'dotenv';
import path from 'path';
import { ChatMessage } from "../models/chat-message.model";

// Load .env from root directory (development only)
// Vercel automatically loads environment variables from dashboard
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export class LlmClient {

    private static llm: ChatOpenAI | undefined;

    static async init() {
        try {
            if (!LlmClient.llm) {
                const apiKey = process.env.OPENAI_API_KEY;
                const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

                if (!apiKey) {
                    throw new Error('OPENAI_API_KEY is not set in environment variables');
                }

                LlmClient.llm = new ChatOpenAI({
                    model: model,
                    apiKey: apiKey,
                });

                console.log(`LLM initialized with model: ${model}`);
            }

        } catch (error) {
            console.error('Error initializing LLM:', error);
            throw error;
        }
    }

    static async prompt(systemPrompt: string, userPrompt: string): Promise<string> {

        return this.promptWithHistory([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);
    }

    static async promptWithHistory(history: ChatMessage[]): Promise<string> {

        await LlmClient.init();

        // Convert ChatMessage[] to the format expected by Langchain
        const langchainMessages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const response = await LlmClient.llm?.invoke(langchainMessages);

        if (!response) {
            throw new Error('No response from LLM');
        }

        return response.content.toString();
    }
}