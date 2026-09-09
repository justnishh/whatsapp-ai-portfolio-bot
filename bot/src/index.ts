import path from 'node:path';
import { buildConfig } from './config.js';
import { loadKnowledge } from './knowledge.js';
import { MemoryStore } from './memory.js';
import { AiEngine } from './ai.js';
import { WahaClient } from './waha.js';
import { createApp } from './webhook.js';
import { logger } from './logger.js';

async function main() {
  const config = buildConfig(process.env as Record<string, string>);
  const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
  const systemPrompt = await loadKnowledge(knowledgeDir);

  if (!systemPrompt) {
    logger.warn('No knowledge loaded; bot will rely only on the system prompt.');
  }

  const memory = new MemoryStore(config.maxHistory, config.memoryTtlMs);
  const ai = new AiEngine(config);
  const waha = new WahaClient(config);

  const app = createApp({ systemPrompt, memory, ai, waha, config });

  app.listen(config.port, () => {
    logger.info({ port: config.port, wahaUrl: config.wahaUrl }, 'Bot listening');
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
