import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/webhook.js';
import type { PipelineContext } from '../src/pipeline.js';

describe('createApp', () => {
  const ai = { reply: vi.fn() };
  const waha = { sendText: vi.fn() };

  beforeEach(() => {
    ai.reply.mockReset();
    waha.sendText.mockReset();
  });

  function makeCtx(): PipelineContext {
    return {
      systemPrompt: 'system',
      memory: { get: () => [], add: () => {}, size: () => 0, clear: () => {} } as any,
      ai: ai as any,
      waha: waha as any,
      config: { wahaApiKey: 'secret-key' } as any,
    };
  }

  it('returns 200 on health', async () => {
    const app = createApp(makeCtx());
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects webhook without api key', async () => {
    const app = createApp(makeCtx());
    const res = await request(app)
      .post('/webhook')
      .send({ event: 'message', session: 'default', payload: { id: 'm1', from: 'x', fromMe: false, body: 'hi', type: 'chat', timestamp: 1 } });
    expect(res.status).toBe(401);
  });

  it('accepts webhook with correct api key and runs pipeline', async () => {
    ai.reply.mockResolvedValue('hello!');
    const app = createApp(makeCtx());
    const res = await request(app)
      .post('/webhook')
      .set('X-Api-Key', 'secret-key')
      .send({
        event: 'message',
        session: 'default',
        payload: {
          id: 'm2',
          from: '919999999999@c.us',
          fromMe: false,
          body: 'hi',
          type: 'chat',
          timestamp: 1,
        },
      });

    expect(res.status).toBe(200);
    expect(waha.sendText).toHaveBeenCalledWith('default', '919999999999@c.us', 'hello!');
  });
});
