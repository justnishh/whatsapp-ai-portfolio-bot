import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WahaClient } from '../src/waha.js';

const baseConfig = {
  wahaUrl: 'http://waha-test:3000',
  wahaApiKey: 'waha-secret',
  testMode: false,
} as const;

describe('WahaClient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a text message with correct payload and auth header', async () => {
    const client = new WahaClient(baseConfig as any);
    await client.sendText('default', '919999999999@c.us', 'hello!');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://waha-test:3000/api/sendText');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-Api-Key': 'waha-secret',
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      session: 'default',
      chatId: '919999999999@c.us',
      text: 'hello!',
    });
  });

  it('logs but does not send in test mode', async () => {
    const client = new WahaClient({ ...baseConfig, testMode: true } as any);
    await client.sendText('default', '919999999999@c.us', 'test reply');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws on non-2xx response', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response);

    const client = new WahaClient(baseConfig as any);
    await expect(client.sendText('default', 'x', 'y')).rejects.toThrow(/WAHA send failed/);
  });
});