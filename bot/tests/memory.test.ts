import { describe, it, expect, vi } from 'vitest';
import { MemoryStore } from '../src/memory.js';
import type { Message } from '../src/types.js';

const sampleUser: Message = {
  id: '1',
  role: 'user',
  text: 'hello',
  timestamp: Date.now(),
};

const sampleAssistant: Message = {
  id: '2',
  role: 'assistant',
  text: 'hi there',
  timestamp: Date.now() + 1,
};

describe('MemoryStore', () => {
  it('returns empty history for unknown user', () => {
    const store = new MemoryStore(10, 60_000);
    expect(store.get('unknown')).toEqual([]);
  });

  it('stores messages in order', () => {
    const store = new MemoryStore(10, 60_000);
    store.add('919999999999@c.us', sampleUser);
    store.add('919999999999@c.us', sampleAssistant);
    expect(store.get('919999999999@c.us')).toEqual([sampleUser, sampleAssistant]);
  });

  it('drops oldest messages when maxHistory exceeded', () => {
    const store = new MemoryStore(2, 60_000);
    store.add('u', { id: 'a', role: 'user', text: 'a', timestamp: 1 });
    store.add('u', { id: 'b', role: 'assistant', text: 'b', timestamp: 2 });
    store.add('u', { id: 'c', role: 'user', text: 'c', timestamp: 3 });
    const history = store.get('u');
    expect(history.map((m) => m.id)).toEqual(['b', 'c']);
  });

  it('evicts expired history per user on get', () => {
    vi.useFakeTimers();
    const store = new MemoryStore(10, 1000);
    store.add('u', { id: 'a', role: 'user', text: 'a', timestamp: Date.now() });
    vi.advanceTimersByTime(1001);
    expect(store.get('u')).toEqual([]);
    vi.useRealTimers();
  });

  it('tracks active user count', () => {
    const store = new MemoryStore(10, 60_000);
    store.add('a', sampleUser);
    store.add('b', sampleUser);
    expect(store.size()).toBe(2);
  });
});