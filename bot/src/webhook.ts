import express, { Application, Request, Response, NextFunction } from 'express';
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
    if (key !== ctx.config.wahaApiKey) {
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
    res.status(500).json({ error: 'internal error' });
  });

  return app;
}
