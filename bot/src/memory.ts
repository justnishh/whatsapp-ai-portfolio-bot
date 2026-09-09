import type { Message } from './types.js';

interface Entry {
  updatedAt: number;
  messages: Message[];
}

export class MemoryStore {
  private data = new Map<string, Entry>();

  constructor(
    private maxHistory: number,
    private ttlMs: number,
  ) {}

  get(phone: string): Message[] {
    const entry = this.data.get(phone);
    if (!entry) return [];
    if (Date.now() - entry.updatedAt > this.ttlMs) {
      this.data.delete(phone);
      return [];
    }
    return entry.messages.slice();
  }

  add(phone: string, message: Message): void {
    const entry = this.data.get(phone);
    const messages = entry ? [...entry.messages, message] : [message];
    if (messages.length > this.maxHistory) {
      messages.shift();
    }
    this.data.set(phone, { updatedAt: Date.now(), messages });
  }

  size(): number {
    return this.data.size;
  }

  // exposed for tests only; not used in production code
  clear(): void {
    this.data.clear();
  }
}