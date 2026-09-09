import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadKnowledge } from '../src/knowledge.js';

describe('loadKnowledge', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'knowledge-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('joins markdown files in alphabetical order', async () => {
    await fs.writeFile(path.join(tmpDir, 'about.md'), '# About\n\nBio');
    await fs.writeFile(path.join(tmpDir, 'persona.md'), 'Persona text');
    await fs.writeFile(path.join(tmpDir, 'resume.md'), 'Resume text');

    const result = await loadKnowledge(tmpDir);
    expect(result).toContain('Persona text');
    expect(result).toContain('Bio');
    expect(result).toContain('Resume text');
  });

  it('returns empty string when directory has no markdown files', async () => {
    await fs.writeFile(path.join(tmpDir, 'notes.txt'), 'not md');
    const result = await loadKnowledge(tmpDir);
    expect(result).toBe('');
  });

  it('returns empty string when directory does not exist', async () => {
    const result = await loadKnowledge(path.join(tmpDir, 'missing'));
    expect(result).toBe('');
  });
});
