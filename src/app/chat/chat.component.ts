import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, UiResponse } from './chat.service';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCard],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  @ViewChild('content') contentEl?: ElementRef<HTMLDivElement>;

  private api = inject(ChatService);

  loading = signal(false);
  question = signal('');
  conversationHistory = signal<{ role: 'user' | 'assistant', text: string | null, content: UiResponse | null }[]>([]);

  constructor() {
    effect(() => {
      const _ = this.conversationHistory();
      queueMicrotask(() => this.scrollToBottom());
    });
  }

  send() {
    if (!this.question().trim()) return;
    const ask = this.question();
    this.question.set('');
    this.loading.set(true);

    this.conversationHistory.update(history => [
      ...history,
      { role: 'user', text: ask, content: null }
    ]);

    this.api.ask(ask).subscribe({
      next: (r) => {
        this.conversationHistory.update(history => [
          ...history,
          { role: 'assistant', content: r, text: null }
        ]);
        this.loading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.loading.set(false);
      }
    });
  }

  clearHistory() {
    this.conversationHistory.set([]);
  }

  formatText(text: string): string {
    if (!text) return '';
    
    return text.replace(/\n/g, '<br>');
  }

  private scrollToBottom() {
    if (this.contentEl) {
      this.contentEl.nativeElement.scrollTop = this.contentEl.nativeElement.scrollHeight;
    }
  }
}
