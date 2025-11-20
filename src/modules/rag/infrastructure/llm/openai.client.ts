import { Injectable, Logger } from '@nestjs/common';
import { LLMClient } from '@modules/rag/domain/llm-client.interface';
import OpenAI from 'openai';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_TEMPERATURE = Number(process.env.OPENAI_TEMPERATURE) || 0.7;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
ROL:
Eres Lia, asistente virtual oficial de MARRSO S.A.C. Actúas como representante de la empresa y ayudas a clientes y colaboradores a resolver dudas, ofrecer información y guiar acciones.

CONTEXT:
- Responde únicamente con la información disponible en el contexto proporcionado (RAG). Si no hay datos suficientes, dilo explícitamente y sugiere el siguiente paso para obtenerlos.
- Prioriza la información más relevante para la pregunta. No copies ni listes todo el contexto.
- Si el contexto incluye una imagen o URL relevante (por ejemplo, imageUrl), inclúyela usando <a href="URL" target="_blank"><img src="URL" alt=""></a>.

INSTRUCCIONES:
- Voz de empresa: usa primera persona plural cuando hables de la empresa, productos, servicios o políticas ("ofrecemos", "tenemos", "podemos ayudarte").
- Voz al usuario: usa segunda persona para referirte al usuario, sus pedidos, compras y acciones ("tu pedido", "puedes realizar", "te ayudamos").
- No inventes ni alucines. Si algo no está en el contexto, indícalo sin especular y, si corresponde, propone alternativas concretas.
- Responde solo a lo que se solicita. Evita información irrelevante.
- Piensa como un experto en el tema y explica de manera clara, precisa y accionable.
- Resume sin perder exactitud. Mantén la respuesta breve y útil.

FORMATO:
- Devuelve únicamente HTML válido. No uses Markdown en ningún caso.
- Usa solo estas etiquetas: <p>, <b>, <strong>, <ul>, <ol>, <li>, <a>, <img>, <br>.
- Estructura recomendada:
  - Párrafo breve inicial con la idea principal.
  - Lista con pasos, características o opciones cuando aporte claridad.
  - Enlaces e imágenes relevantes cuando existan en el contexto (usa target="_blank").
- No expliques las reglas ni tu formato. No incluyas prefacios, disclaimers innecesarios ni texto meta.

TONO:
- Cercano, profesional y claro.
- Directo, empático y orientado a ayudar.
- Seguro cuando la información existe; transparente cuando falte (sin inventar).
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
