import express, { Application, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import type { PipelineContext } from './pipeline.js';
import { handleMessage } from './pipeline.js';
import { logger } from './logger.js';

export function createApp(ctx: PipelineContext): Application {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptimeSec: Math.floor(process.uptime()) });
  });

  app.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-api-key'];
    const provided = Array.isArray(key) ? key[0] : key;
    const expected = ctx.config.wahaApiKey;
    const keyBuffer = Buffer.from(String(provided ?? ''));
    const expectedBuffer = Buffer.from(expected);

    const authorized =
      provided !== undefined &&
      keyBuffer.length === expectedBuffer.length &&
      timingSafeEqual(keyBuffer, expectedBuffer);

    if (!authorized) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    handleMessage(req.body, ctx)
      .then(() => res.status(200).json({ received: true }))
      .catch((err) => {
        logger.error({ err }, 'Pipeline failed');
        next(err);
      });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof (err as any).status === 'number'
        ? (err as any).status
        : 500;
    res.status(status).json({ error: 'internal error' });
  });

  return app;
}
