import { getSystemPrompt } from "../config/system-prompts";
import { LlmClient } from "../lib/llm-client";
import { ChatResponse } from "../models/chat-response.model";
import { ChatMessage } from "../models/chat-message.model";

export class LlmService {
    
    async prompt(prompt: string): Promise<ChatResponse> {

        const systemPrompt = getSystemPrompt('MAIN_CHATBOT');
        
        const response = await LlmClient.prompt(systemPrompt, prompt);
        
        try {
            // Parse the JSON response
            const parsedResponse = JSON.parse(response);
            return parsedResponse as ChatResponse;
        } catch (error) {
            console.error('Failed to parse LLM response as JSON:', error);
            console.log('Raw response:', response);
            
            // Fallback: return a structured response with the raw text
            return {
                messageId: `msg_${Date.now()}`,
                blocks: [
                    {
                        kind: "text",
                        text: response
                    }
                ],
                suggestions: [
                    "Could you please rephrase your question?",
                    "What specific Aptar product are you interested in?",
                    "How can I help you with your dispensing needs?"
                ]
            };
        }
    }


    async promptWithHistory(history: ChatMessage[]): Promise<ChatResponse> {
        
        const systemPrompt = getSystemPrompt('MAIN_CHATBOT');
        
        const response = await LlmClient.promptWithHistory([
            { role: "system", content: systemPrompt },
            ...history,
        ]);
        
        try {
            // Parse the JSON response
            const parsedResponse = JSON.parse(response);
            return parsedResponse as ChatResponse;
        } catch (error) {
            console.error('Failed to parse LLM response as JSON:', error);
            console.log('Raw response:', response);
            
            // Fallback: return a structured response with the raw text
            return {
                messageId: `msg_${Date.now()}`,
                blocks: [
                    {
                        kind: "text",
                        text: response
                    }
                ],
                suggestions: [
                    "Could you please rephrase your question?",
                    "What specific Aptar product are you interested in?",
                    "How can I help you with your dispensing needs?"
                ]
            };
        }
    }
}