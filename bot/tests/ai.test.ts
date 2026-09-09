import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiEngine } from '../src/ai.js';
import type { Message } from '../src/types.js';

const createMock = vi.fn();

vi.mock('openai', () => {
  return {
    default: class {
      chat = { completions: { create: createMock } };
    },
  };
});

describe('AiEngine', () => {
  const config = {
    openaiApiKey: 'sk-test',
    openaiModel: 'gpt-4o-mini',
  } as any;

  beforeEach(() => {
    createMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls OpenAI with system + history + user message', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { role: 'assistant', content: 'Hello Nishant fan!' } }],
    });

    const engine = new AiEngine(config);
    const history: Message[] = [
      { id: '1', role: 'user', text: 'hi', timestamp: 1 },
      { id: '2', role: 'assistant', text: 'hello!', timestamp: 2 },
    ];
    const reply = await engine.reply('You are Nishant bot.', history, 'who is Nishant?');

    expect(reply).toBe('Hello Nishant fan!');
    expect(createMock).toHaveBeenCalledOnce();
    const args = createMock.mock.calls[0][0];
    expect(args.model).toBe('gpt-4o-mini');
    expect(args.messages).toEqual([
      { role: 'system', content: 'You are Nishant bot.' },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello!' },
      { role: 'user', content: 'who is Nishant?' },
    ]);
    expect(args.temperature).toBe(0.7);
    expect(args.max_tokens).toBe(500);
  });

  it('returns fallback when content is empty', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '' } }] });
    const engine = new AiEngine(config);
    const reply = await engine.reply('system', [], 'x');
    expect(reply).toMatch(/couldn't think/);
  });

  it('returns friendly message on OpenAI error', async () => {
    createMock.mockRejectedValue(new Error('Rate limit'));
    const engine = new AiEngine(config);
    const reply = await engine.reply('system', [], 'x');
    expect(reply).toMatch(/too many requests|busy/i);
  });
});
