import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { logger } from './logger.js';

export async function loadKnowledge(dir: string): Promise<string> {
  try {
    const info = await stat(dir);
    if (!info.isDirectory()) return '';
  } catch (err) {
    logger.warn({ dir, err }, 'Knowledge directory not found');
    return '';
  }

  const entries = await readdir(dir);
  const mdFiles = entries
    .filter((f) => f.endsWith('.md'))
    .sort();

  if (mdFiles.length === 0) {
    logger.warn({ dir }, 'No markdown files in knowledge directory');
    return '';
  }

  const parts = await Promise.all(
    mdFiles.map(async (f) => {
      const content = await readFile(path.join(dir, f), 'utf-8');
      return `--- ${f} ---\n\n${content.trim()}\n`;
    })
  );

  return parts.join('\n').trim();
}
