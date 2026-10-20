import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [ChatComponent, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sales-sustainability');
  protected readonly isChatOpen = signal(false);
  protected readonly isChatMaximized = signal(false);
  protected readonly isChatMaximizing = signal(false);

  toggleChat() {
    this.isChatOpen.set(!this.isChatOpen());
    // Reset maximized state when closing chat
    if (!this.isChatOpen()) {
      this.isChatMaximized.set(false);
      this.isChatMaximizing.set(false);
    }
  }

  isChatMaximizingState() {
    return this.isChatMaximizing();
  }

  toggleMaximize() {
    if (!this.isChatMaximized()) {
      // Starting to maximize
      this.isChatMaximizing.set(true);
      setTimeout(() => {
        this.isChatMaximizing.set(false);
        this.isChatMaximized.set(true);
      }, 150); // Match animation duration
    } else {
      // Minimizing
      this.isChatMaximized.set(false);
    }
  }
}
