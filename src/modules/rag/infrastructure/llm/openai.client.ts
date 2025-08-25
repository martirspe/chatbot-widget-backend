import { Injectable } from '@nestjs/common';
import { LLMClient } from '../../domain/llm-client.interface';
import OpenAI from 'openai';

@Injectable()
export class OpenAiClient implements LLMClient {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generate(prompt: string, context: string[]): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'Eres Asistente MARRSO. Responde en español de forma cordial y precisa. No inventes datos.',
      },
      {
        role: 'user',
        content: `${prompt}\n\nContexto:\n${context.join('\n')}`,
      },
    ];

    const resp = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    return (
      resp.choices?.[0]?.message?.content ?? 'Lo siento, no pude generar una respuesta.'
    );
  }
}
