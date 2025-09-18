import { Injectable, Inject, Logger } from '@nestjs/common';
import axios from 'axios';
import { VectorStore } from '../../domain/vector-store.interface';
import { EmbeddingClient } from '../../domain/embedding-client.interface';
import { QdrantSearchResult } from '../../domain/qdrant-search-result.interface';
import { generateDeterministicUuid, normalizeText, fragmentText } from '../../../../common/utils/text.utils';
import { formatError } from '../../../../common/utils/error.utils';

// Implementa la lógica de almacenamiento y búsqueda de vectores en Qdrant.
@Injectable()
export class QdrantStore implements VectorStore {
  private readonly url = process.env.QDRANT_URL;
  private readonly collection = process.env.QDRANT_COLLECTION;
  private readonly logger = new Logger(QdrantStore.name);

  // Inyecta el cliente de embeddings para generar vectores.
  constructor(
    @Inject('EmbeddingClient') private readonly embeddingClient: EmbeddingClient
  ) {
    if (!this.url || !this.collection) {
      throw new Error('QDRANT_URL y QDRANT_COLLECTION deben estar definidas en las variables de entorno.');
    }
  }

  // Asegura que la colección de Qdrant exista antes de operar.
  async ensureCollection(): Promise<void> {
    try {
      await axios.put(`${this.url}/collections/${this.collection}`, {
        vectors: {
          size: 1536, // Tamaño del vector, ajustar según el modelo de embedding.
          distance: 'Cosine',
        },
      });
      this.logger.log(`Colección Qdrant '${this.collection}' asegurada.`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        this.logger.warn(`Colección Qdrant '${this.collection}' ya existe.`);
        return;
      }
      this.logger.error(`Error asegurando colección Qdrant: ${formatError(error)}`);
      throw error;
    }
  }

  // Inserta o actualiza documentos fragmentados y enriquecidos en la colección de Qdrant.
  async upsert(docs: { text: string; source?: string; metadata?: Record<string, any> }[]): Promise<void> {
    await this.ensureCollection();

    const fragments = docs.flatMap(doc =>
      fragmentText(doc.text).map(fragment => ({
        text: fragment,
        source: doc.source,
        metadata: {
          ...doc.metadata,
          fragmentLength: fragment.length,
          originalSource: doc.source,
          indexedAt: new Date().toISOString()
        }
      }))
    );

    const points = await Promise.all(fragments.map(async doc => {
      const id = generateDeterministicUuid(doc.text, doc.source);
      try {
        const vector = await this.embeddingClient.embed(doc.text);
        return {
          id,
          vector,
          payload: {
            text: doc.text,
            source: doc.source,
            metadata: doc.metadata
          }
        };
      } catch (error: any) {
        this.logger.error(`Error generando embedding para ID ${id}: ${error.message || error}`);
        return null;
      }
    }));

    const validPoints = points.filter(p => p !== null);

    // Consulta puntos existentes para evitar duplicados antes de upsert.
    const existingIds = validPoints.map(p => p.id);
    let existingPoints: Record<string, any> = {};
    try {
      const res = await axios.post(`${this.url}/collections/${this.collection}/points/scroll`, {
        filter: { must: [{ key: 'id', match: { any: existingIds } }] },
        limit: existingIds.length,
      });
      for (const point of res.data?.result?.points || []) {
        existingPoints[point.id] = point.payload?.text;
      }
    } catch (error: any) {
      this.logger.error(`Error consultando puntos existentes: ${formatError(error)}`);
    }

    // Filtra puntos que necesitan insert/update y realiza el upsert.
    const pointsToUpsert = validPoints.filter(p => existingPoints[p.id] !== p.payload.text);

    if (pointsToUpsert.length > 0) {
      try {
        await axios.put(`${this.url}/collections/${this.collection}/points`, {
          points: pointsToUpsert
        });
        this.logger.log(`Upserted ${pointsToUpsert.length} points`);
      } catch (error: any) {
        this.logger.error(`Qdrant error: ${formatError(error)}`);
      }
    } else {
      this.logger.log('No hay puntos nuevos o modificados para upsert.');
    }
  }

  // Realiza una búsqueda semántica en Qdrant y retorna los resultados relevantes filtrados por score.
  async search(query: string, topK: number, minScore: number, source?: string): Promise<QdrantSearchResult[]> {
    const vector = await this.embeddingClient.embed(normalizeText(query));
    const filter = source
      ? { must: [{ key: 'source', match: { value: source } }] }
      : undefined;

    const res = await axios.post(`${this.url}/collections/${this.collection}/points/search`, {
      vector,
      limit: topK,
      with_payload: true,
      ...(filter && { filter })
    });
    const hits = res.data?.result || [];
    console.log('Resultados Qdrant:', hits.length, hits.map((h: any) => h.id));
    return hits
      .filter((h: any) => typeof h.score === 'number' && h.score >= minScore)
      .map((h: any) => ({
        id: h.id,
        text: h.payload?.text || '',
        source: h.payload?.source || '',
        score: h.score,
        metadata: h.payload?.metadata || {}
      }));
  }
}
