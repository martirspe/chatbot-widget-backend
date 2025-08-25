import { Injectable, Inject, Logger } from '@nestjs/common';
import { VectorStore } from '../../rag/domain/vector-store.interface';
import { randomUUID } from 'crypto';

interface IngestDocument {
  id: string;
  text: string;
  source?: string;
  timestamp: string;
}

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    @Inject('VectorStore') private readonly vectorStore: VectorStore,
  ) {}

  /**
   * Ingresa un arreglo de textos al vector store, fragmentando si es necesario.
   * @param texts Array de textos a ingresar.
   * @param source Fuente o nombre del documento original.
   * @param chunkSize Tamaño máximo de cada fragmento (opcional, recomendado para rendimiento).
   */
  async ingestTexts(
    texts: string[],
    source?: string,
    chunkSize: number = 1000
  ) {
    const timestamp = new Date().toISOString();
    const docs: IngestDocument[] = [];

    for (const t of texts) {
      // Fragmenta el texto si es muy largo
      const chunks = this.chunkText(t, chunkSize);
      for (const chunk of chunks) {
        docs.push({
          id: randomUUID(),
          text: source ? `[${source}] ${chunk}` : chunk,
          source,
          timestamp,
        });
      }
    }

    try {
      await this.vectorStore.upsert(docs);
      this.logger.log(
        `Ingestados ${docs.length} fragmentos desde ${source ?? 'sin fuente'}`
      );
      return { inserted: docs.length, source, timestamp };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : JSON.stringify(error);
      this.logger.error(
        `Error al ingresar documentos desde ${source ?? 'sin fuente'}: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Fragmenta un texto largo en trozos de tamaño máximo chunkSize.
   */
  private chunkText(text: string, chunkSize: number): string[] {
    if (text.length <= chunkSize) return [text];
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }
}
