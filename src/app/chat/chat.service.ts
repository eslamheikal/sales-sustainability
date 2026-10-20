import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductCardModel } from '../product-card/product-card.model';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type UiBlock =
  | { kind: 'text'; text: string }
  | { kind: 'image'; url: string; alt?: string }
  | { kind: 'link'; href: string; label?: string }
  | { kind: 'reference'; title: string; url?: string; snippet?: string; score?: number }
  | { kind: 'chart'; spec: any };

export type UiResponse = {
  messageId: string;
  blocks: UiBlock[];
  citations?: { title?: string; score?: number }[];
  suggestions?: string[];
  products?: ProductCardModel[];
};

export interface ChatRequest {
  prompt: string;
  history?: ChatMessage[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  ask(prompt: string, history?: ChatMessage[]) {
    const request: ChatRequest = { prompt, history };
    return this.http.post<UiResponse>(`${environment.chatApiUrl}`, request);
  }
}
