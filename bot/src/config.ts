import { z } from 'zod';

const configSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  WAHA_API_KEY: z.string().min(1),
  WAHA_URL: z.string().url().default('http://waha:3000'),
  KNOWLEDGE_DIR: z.string().default('./knowledge'),
  PORT: z.string().default('3333').transform(Number),
  MAX_HISTORY: z.string().default('10').transform(Number),
  MEMORY_TTL_MS: z.string().default('3600000').transform(Number),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  TEST_MODE: z.string().default('0').transform((v) => v === '1'),
  OWNER_NUMBERS: z.string().default('').transform((v) =>
    v.split(',').map((s) => s.trim()).filter(Boolean)
  ),
}).transform((raw) => ({
  openaiApiKey: raw.OPENAI_API_KEY,
  openaiBaseUrl: raw.OPENAI_BASE_URL,
  openaiModel: raw.OPENAI_MODEL,
  wahaApiKey: raw.WAHA_API_KEY,
  wahaUrl: raw.WAHA_URL,
  knowledgeDir: raw.KNOWLEDGE_DIR,
  port: raw.PORT,
  maxHistory: raw.MAX_HISTORY,
  memoryTtlMs: raw.MEMORY_TTL_MS,
  logLevel: raw.LOG_LEVEL,
  testMode: raw.TEST_MODE,
  ownerNumbers: raw.OWNER_NUMBERS,
}));

export type Config = z.infer<typeof configSchema>;

export function buildConfig(env: Record<string, string | undefined>): Config {
  return configSchema.parse(env);
}