export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ChatHistory {
    messages: ChatMessage[];
}

export interface ChatRequest {
    prompt: string;
    history?: ChatMessage[];
}
