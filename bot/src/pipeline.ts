import type { Config } from './config.js';
import type { MemoryStore } from './memory.js';
import type { AiEngine } from './ai.js';
import type { WahaClient } from './waha.js';
import type { WahaWebhookBody, Message } from './types.js';
import { logger } from './logger.js';

export interface PipelineContext {
  systemPrompt: string;
  memory: MemoryStore;
  ai: AiEngine;
  waha: WahaClient;
  config: Config;
}

const seenIds = new Set<string>();
const MAX_SEEN = 1000;

export async function handleMessage(
  body: WahaWebhookBody,
  ctx: PipelineContext,
): Promise<void> {
  const { event, session, payload } = body;

  if (event !== 'message' || payload.fromMe || payload.type !== 'chat' || !payload.body?.trim()) {
    logger.debug({ event, fromMe: payload.fromMe, type: payload.type }, 'Ignoring webhook event');
    return;
  }

  if (seenIds.has(payload.id)) {
    logger.debug({ id: payload.id }, 'Duplicate message id ignored');
    return;
  }
  seenIds.add(payload.id);
  if (seenIds.size > MAX_SEEN) {
    const first = seenIds.values().next().value;
    if (first) seenIds.delete(first);
  }

  const phone = payload.from;
  const text = payload.body.trim();

  const history = ctx.memory.get(phone);
  const reply = await ctx.ai.reply(ctx.systemPrompt, history, text);

  const userMsg: Message = {
    id: payload.id,
    role: 'user',
    text,
    timestamp: payload.timestamp,
  };
  ctx.memory.add(phone, userMsg);

  await ctx.waha.sendText(session, phone, reply);

  ctx.memory.add(phone, {
    id: `reply-${payload.id}`,
    role: 'assistant',
    text: reply,
    timestamp: Date.now(),
  });
}