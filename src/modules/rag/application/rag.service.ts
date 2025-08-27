import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { VectorStore } from '../domain/vector-store.interface';
import { LLMClient } from '../domain/llm-client.interface';
import { RagMode } from '../domain/rag-mode.interface';

@Injectable()
export class RagService {
  constructor(
    @Inject('VectorStore') private readonly vectorStore: VectorStore,
    @Inject('LLMClient') private readonly llm: LLMClient,
  ) { }

  async answer(query: string) {
    if (this.isTestMode()) {
      return this.mockAnswer(query);
    }
    switch (this.getMode()) {
      case 'llm':
        return this.llmOnlyAnswer(query);
      case 'qdrant':
        return this.qdrantOnlyAnswer(query);
      case 'both':
      default:
        return this.realAnswerSafe(query);
    }
  }

  private isTestMode(): boolean {
    return process.env.RAG_TEST_MODE === 'true';
  }

  private getMode(): RagMode {
    const mode = (process.env.RAG_MODE || RagMode.BOTH).toLowerCase();
    switch (mode) {
      case RagMode.LLM:
        return RagMode.LLM;
      case RagMode.QDRANT:
        return RagMode.QDRANT;
      case RagMode.BOTH:
      default:
        return RagMode.BOTH;
    }
  }

  private async llmOnlyAnswer(query: string) {
    try {
      const reply = await this.llm.generate(query, []);
      return { reply, context: [], documents: [] }; // <-- cambia docs por documents
    } catch (error) {
      console.error('Error en LLM:', error);
      throw new InternalServerErrorException('No se pudo obtener respuesta del LLM.');
    }
  }

  private async qdrantOnlyAnswer(query: string) {
    try {
      const docs = await this.vectorStore.search(query, 3);
      if (!docs || docs.length === 0) {
        return {
          reply: 'No se encontró información relevante para tu consulta.',
          context: [],
          documents: []
        };
      }
      return {
        reply: 'Documentos encontrados.',
        context: docs.map(d => d.text),
        documents: docs
      };
    } catch (error) {
      console.error('Error en Qdrant:', error);
      throw new InternalServerErrorException('No se pudo obtener respuesta de Qdrant.');
    }
  }

  private async realAnswerSafe(query: string) {
    try {
      const docs = await this.vectorStore.search(query, 3);
      const context = docs.map((d) => d.text);
      const reply = await this.llm.generate(query, context);
      return { reply, context, documents: docs }; // <-- cambia docs por documents
    } catch (error) {
      console.error('Error en RAG realAnswer:', error);
      throw new InternalServerErrorException('No se pudo obtener respuesta del motor vectorial o LLM.');
    }
  }

  private mockAnswer(query: string) {
    return {
      reply: `Respuesta simulada para: "${query}"`,
      context: [],
      documents: []
    };
  }
}