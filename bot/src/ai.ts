import OpenAI from 'openai';
import type { Config } from './config.js';
import type { Message } from './types.js';
import { logger } from './logger.js';

export class AiEngine {
  private client: OpenAI;

  constructor(private config: Config) {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      ...(config.openaiBaseUrl && { baseURL: config.openaiBaseUrl }),
    });
  }

  async reply(systemPrompt: string, history: Message[], newMessage: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: newMessage },
    ];

    try {
      const res = await this.client.chat.completions.create({
        model: this.config.openaiModel,
        messages,
        temperature: 0.7,
        max_tokens: 150,
      });

      const raw = res.choices[0]?.message?.content?.trim();
      if (!raw) {
        return "I couldn't think of a reply. Try rephrasing?";
      }
      // Strip reasoning blocks from thinking models (<think>...</think> or plain-text preambles)
      const content = raw
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^(here'?s? (my |a )?think(ing)?(\s+process)?[:\-]?[\s\S]*?\n\n)/i, '')
        .trim();
      return content || raw;
    } catch (err) {
      logger.error({ err }, 'OpenAI request failed');
      return "I'm a bit busy right now. Try again in a moment!";
    }
  }
}
