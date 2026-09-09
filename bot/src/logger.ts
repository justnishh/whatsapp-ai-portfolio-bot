import pino from 'pino';
import { buildConfig } from './config.js';

function getLogger() {
  const cfg = buildConfig(process.env as Record<string, string>);
  return pino({
    level: cfg.logLevel,
    transport: process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
  });
}

export const logger = getLogger();