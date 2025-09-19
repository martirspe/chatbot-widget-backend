import { Injectable, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { VectorStore } from '../domain/vector-store.interface';
import { LLMClient } from '../domain/llm-client.interface';
import { RagMode } from '../domain/rag-mode.interface';
import { formatError } from '../../../common/utils/error.utils';

// Servicio RAG para generar respuestas usando búsqueda semántica y LLM.
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  // Inyecta el servicio de búsqueda vectorial y el cliente LLM.
  constructor(
    @Inject('VectorStore') private readonly vectorStore: VectorStore,
    @Inject('LLMClient') private readonly llm: LLMClient,
  ) { }

  // Genera una respuesta según el modo configurado y los parámetros de búsqueda.
  async answer(query: string, topK: number = 5, minScore: number = 0.3, source?: string) {
    if (this.isTestMode()) {
      return this.mockAnswer(query);
    }
    switch (this.getMode()) {
      case 'llm':
        return this.llmOnlyAnswer(query);
      case 'qdrant':
        return this.qdrantOnlyAnswer(query, topK, minScore, source);
      case 'both':
      default:
        return this.realAnswerSafe(query, topK, minScore, source);
    }
  }

  // Verifica si está activado el modo de prueba.
  private isTestMode(): boolean {
    return process.env.RAG_TEST_MODE === 'true';
  }

  // Obtiene el modo de operación configurado.
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

  // Genera respuesta solo con LLM, sin contexto documental.
  private async llmOnlyAnswer(query: string) {
    try {
      const reply = await this.llm.generate(query, []);
      return { reply, context: [], documents: [] };
    } catch (error) {
      this.logger.error(`Error en LLM: ${formatError(error)}`);
      throw new InternalServerErrorException('No se pudo obtener respuesta del LLM.');
    }
  }

  // Busca documentos relevantes solo en Qdrant y retorna el resultado.
  private async qdrantOnlyAnswer(query: string, topK: number, minScore: number, source?: string) {
    const docs = await this.vectorStore.search(query, topK, minScore, source);
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
  }

  // Busca documentos en Qdrant y genera respuesta con LLM usando el contexto.
  private async realAnswerSafe(query: string, topK: number, minScore: number, source?: string) {
    const docs = await this.vectorStore.search(query, topK, minScore, source);
    const filteredDocs = docs.filter(d => d.score >= minScore && d.text && d.text.trim().length > 0);
    const context = filteredDocs.map((d) => {
      let meta = '';
      if (d.metadata) {
        try {
          const m = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata;
          meta = `[${m.title ?? ''}] (${m.section ?? ''})`;
        } catch { /* ignore */ }
      }
      return `${meta}\n${d.text}`;
    });
    const reply = await this.llm.generate(query, context);
    return { reply, context, documents: filteredDocs };
  }

  // Retorna una respuesta simulada para pruebas.
  private mockAnswer(query: string) {
    return {
      reply: `Respuesta simulada para: "${query}"`,
      context: [],
      documents: []
    };
  }
}