import OpenAI from 'openai';
import type { Config } from './config.js';
import type { Message } from './types.js';
import { logger } from './logger.js';

export class AiEngine {
  private client: OpenAI;

  constructor(private config: Config) {
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
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
        max_tokens: 500,
      });

      const content = res.choices[0]?.message?.content?.trim();
      if (!content) {
        return "I couldn't think of a reply. Try rephrasing?";
      }
      return content;
    } catch (err) {
      logger.error({ err }, 'OpenAI request failed');
      return "I'm a bit busy right now. Try again in a moment!";
    }
  }
}
