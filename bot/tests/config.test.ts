import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { buildConfig } from '../src/config.js';

const baseEnv = {
  OPENAI_API_KEY: 'sk-test',
  WAHA_API_KEY: 'waha-secret',
};

describe('buildConfig', () => {
  it('parses valid env with defaults', () => {
    const cfg = buildConfig({
      ...baseEnv,
      OPENAI_MODEL: 'gpt-4o',
      PORT: '4444',
    });
    expect(cfg.openaiModel).toBe('gpt-4o');
    expect(cfg.port).toBe(4444);
    expect(cfg.wahaUrl).toBe('http://waha:3000');
    expect(cfg.maxHistory).toBe(10);
    expect(cfg.memoryTtlMs).toBe(3600000);
    expect(cfg.logLevel).toBe('info');
    expect(cfg.testMode).toBe(false);
  });

  it('throws when required keys are missing', () => {
    expect(() => buildConfig({})).toThrow(z.ZodError);
  });

  it('parses TEST_MODE=1 as true', () => {
    const cfg = buildConfig({ ...baseEnv, TEST_MODE: '1' });
    expect(cfg.testMode).toBe(true);
  });

  it('defaults KNOWLEDGE_DIR to ./knowledge', () => {
    const cfg = buildConfig({ ...baseEnv });
    expect(cfg.knowledgeDir).toBe('./knowledge');
  });
});