import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMessage } from '../src/pipeline.js';
import { MemoryStore } from '../src/memory.js';

function makePayload(body: string, overrides = {}) {
  return {
    event: 'message',
    session: 'default',
    payload: {
      id: `msg-${Math.random().toString(36).slice(2, 10)}`,
      from: '919999999999@c.us',
      fromMe: false,
      body,
      type: 'chat',
      timestamp: Date.now(),
      ...overrides,
    },
  };
}

describe('handleMessage', () => {
  const ai = { reply: vi.fn() };
  const waha = { sendText: vi.fn() };
  const store = new MemoryStore(10, 60_000);
  const config = { wahaApiKey: 'x' } as any;

  beforeEach(() => {
    ai.reply.mockReset();
    waha.sendText.mockReset();
    store.clear();
  });

  it('replies and stores both messages', async () => {
    ai.reply.mockResolvedValue('Nishant is a developer.');

    await handleMessage(
      makePayload('who is Nishant?'),
      { systemPrompt: 'You are Nishant bot.', memory: store, ai, waha, config }
    );

    expect(ai.reply).toHaveBeenCalledOnce();
    expect(waha.sendText).toHaveBeenCalledWith('default', '919999999999@c.us', 'Nishant is a developer.');

    const history = store.get('919999999999@c.us');
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe('user');
    expect(history[1].role).toBe('assistant');
  });

  it('ignores messages from the bot itself', async () => {
    await handleMessage(
      makePayload('ignored', { fromMe: true }),
      { systemPrompt: '', memory: store, ai, waha, config }
    );
    expect(ai.reply).not.toHaveBeenCalled();
  });

  it('ignores non-chat messages', async () => {
    await handleMessage(
      makePayload('image', { type: 'image' }),
      { systemPrompt: '', memory: store, ai, waha, config }
    );
    expect(ai.reply).not.toHaveBeenCalled();
  });

  it('falls back gracefully when send fails', async () => {
    ai.reply.mockResolvedValue('reply text');
    waha.sendText.mockRejectedValue(new Error('boom'));

    await expect(
      handleMessage(makePayload('hi'), { systemPrompt: '', memory: store, ai, waha, config })
    ).rejects.toThrow('boom');
  });
});