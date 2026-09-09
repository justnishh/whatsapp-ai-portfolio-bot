import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      OPENAI_API_KEY: 'test-openai-key',
      WAHA_API_KEY: 'test-waha-key',
      TEST_MODE: '1',
    },
  },
});