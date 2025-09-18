import { Injectable, Inject, Logger } from '@nestjs/common';
import { VectorStore } from '../../rag/domain/vector-store.interface';
import { IngestDocDto } from '../dto/ingest-doc.dto';
import { generateDeterministicUuid } from '../../../common/utils/text.utils';
import { formatError } from '../../../common/utils/error.utils';

// Servicio para procesar y enviar documentos enriquecidos al vector store.
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  // Inyecta el servicio de almacenamiento vectorial (Qdrant).
  constructor(
    @Inject('VectorStore') private readonly vectorStore: VectorStore,
  ) { }

  // Procesa y envía un arreglo de documentos enriquecidos al vector store.
  async ingestDocs(docs: IngestDocDto[]) {
    const timestamp = new Date().toISOString();

    // Genera ID determinístico y agrega metadata contextual a cada documento.
    const enrichedDocs = docs.map(doc => ({
      id: generateDeterministicUuid(doc.text, doc.source),
      text: doc.text,
      source: doc.source,
      vector: doc.vector,
      metadata: {
        ...doc.metadata,
        indexedAt: timestamp,
        originalSource: doc.source,
      }
    }));

    try {
      // Inserta los documentos en el vector store y retorna cantidad insertada y timestamp.
      await this.vectorStore.upsert(enrichedDocs);
      this.logger.log(
        `Ingestados ${enrichedDocs.length} fragmentos enriquecidos`
      );
      return { inserted: enrichedDocs.length, timestamp };
    } catch (error) {
      // Maneja errores de forma eficiente y los registra.
      this.logger.error(
        `Error al ingresar documentos enriquecidos: ${formatError(error)}`
      );
      throw error;
    }
  }
}
