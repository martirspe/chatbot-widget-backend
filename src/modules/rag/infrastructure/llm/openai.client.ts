import { Injectable, Logger } from '@nestjs/common';
import { LLMClient } from '@modules/rag/domain/llm-client.interface';
import OpenAI from 'openai';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_TEMPERATURE = Number(process.env.OPENAI_TEMPERATURE) || 0.7;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
Eres Lia, asistente de MARRSO.
Responde únicamente usando el contexto proporcionado.
Cuando hables sobre la empresa, productos, servicios o políticas, utiliza siempre la primera persona plural (“ofrecemos”, “tenemos”, “podemos ayudarte”) como representante oficial de MARRSO S.A.C.
Cuando te refieras al usuario, sus compras, pedidos, beneficios o acciones, utiliza la segunda persona (“tus compras”, “tu pedido”, “puedes realizar”, “te ayudamos”).
Si no tienes información suficiente, indícalo sin inventar.
Analiza el contexto y responde solo a lo que el usuario solicita, mostrando únicamente la información relevante y útil.
Sintetiza la respuesta y evita copiar o listar todo el contexto.
Piensa como un experto y responde de forma clara, concisa y útil para el usuario.
Si la respuesta requiere formato visual (listas, pasos, características, etc.), usa únicamente etiquetas HTML (<ul>, <ol>, <li>, <b>, <strong>, <p>).
Si hay una imagen relevante en el contexto (por ejemplo, imageUrl), inclúyela como <a href="URL" target="_blank"><img src="URL"></a>.
No uses Markdown bajo ninguna circunstancia.
No uses texto plano para listas o características si puedes usar HTML.
No expliques el formato ni incluyas instrucciones en la respuesta.
No repitas el contexto completo, responde de forma razonada y específica.
`;

@Injectable()
export class OpenAiClient implements LLMClient {
  private readonly logger = new Logger(OpenAiClient.name);
  private readonly client: OpenAI;

  private readonly model = OPENAI_MODEL;
  private readonly temperature = OPENAI_TEMPERATURE;

  constructor() {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está definido en las variables de entorno');
    }
    this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
  }

  private buildContextText(prompt: string, context: string[]): string {
    return context.length
      ? `Utiliza únicamente la siguiente información para responder:\n${context.join('\n')}\n\nPregunta: ${prompt}`
      : prompt;
  }

  async generate(prompt: string, context: string[] = []): Promise<string> {
    const contextText = this.buildContextText(prompt, context);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: contextText,
      },
    ];

    try {
      const resp = await this.client.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        messages,
      });

      const answer = resp.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        this.logger.warn('OpenAI no devolvió contenido en la respuesta');
        return 'Lo siento, no pude generar una respuesta.';
      }
      return answer;
    } catch (error) {
      this.logger.error('Error generando respuesta de OpenAI', error as Error);
      throw new Error('Error al generar respuesta con OpenAI');
    }
  }
}
