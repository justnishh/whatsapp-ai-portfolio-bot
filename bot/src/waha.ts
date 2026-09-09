import type { Config } from './config.js';
import { logger } from './logger.js';

export class WahaClient {
  private sendUrl: string;

  constructor(private config: Config) {
    this.sendUrl = new URL('/api/sendText', config.wahaUrl).toString();
  }

  async sendText(session: string, chatId: string, text: string): Promise<void> {
    if (this.config.testMode) {
      logger.info({ session, chatId, text }, 'TEST_MODE: would send reply');
      return;
    }

    logger.debug({ session, chatId }, 'Sending WAHA message');

    try {
      await this.attemptSend(session, chatId, text);
    } catch (err) {
      logger.warn({ err }, 'WAHA send failed, retrying once after 1s backoff');
      await new Promise((r) => setTimeout(r, 1000));
      try {
        await this.attemptSend(session, chatId, text);
      } catch (retryErr) {
        throw retryErr;
      }
    }
  }

  private async attemptSend(session: string, chatId: string, text: string): Promise<void> {
    const res = await fetch(this.sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.wahaApiKey,
      },
      body: JSON.stringify({ session, chatId, text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WAHA send failed: ${res.status} ${body}`);
    }
  }
}