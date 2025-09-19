import { Injectable } from '@nestjs/common';
import { LLMClient } from '../../domain/llm-client.interface';
import OpenAI from 'openai';

// Cliente LLM que utiliza la API de OpenAI para generar respuestas en español usando el modelo 'gpt-4o-mini'.
@Injectable()
export class OpenAiClient implements LLMClient {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Genera una respuesta textual usando el prompt y contexto proporcionado.
  async generate(prompt: string, context: string[]): Promise<string> {
    const contextText =
      context.length > 0
        ? `Utiliza únicamente la siguiente información para responder:\n${context.join('\n',)}\n\nPregunta: ${prompt}`
        : prompt;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'Eres Lia, asistente de MARRSO. Responde solo con el contexto. Si no tienes información suficiente, indícalo. No inventes.'
      },
      {
        role: 'user',
        content: contextText,
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
