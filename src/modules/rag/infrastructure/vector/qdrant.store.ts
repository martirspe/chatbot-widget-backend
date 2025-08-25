import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import { v5 as uuidv5 } from 'uuid';
import { VectorStore } from '../../domain/vector-store.interface';
import { EmbeddingClient } from '../../domain/embedding-client.interface';

// Namespace UUID para generar IDs determinísticos (puedes usar un valor fijo)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function generateDeterministicUuid(text: string, source?: string): string {
  // Usa UUID v5 para obtener un UUID válido y único por texto y fuente
  return uuidv5((source ?? '') + '|' + text, NAMESPACE);
}

@Injectable()
export class QdrantStore implements VectorStore {
  private readonly url = process.env.QDRANT_URL || 'http://localhost:6333';
  private readonly collection = process.env.QDRANT_COLLECTION || 'docs';

  constructor(
    @Inject('EmbeddingClient') private readonly embeddingClient: EmbeddingClient
  ) {}

  async ensureCollection(): Promise<void> {
    try {
      await axios.put(`${this.url}/collections/${this.collection}`, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
    } catch (error: any) {
      if (error.response?.status !== 400) throw error;
    }
  }

  async upsert(docs: { text: string; source?: string }[]): Promise<void> {
    await this.ensureCollection();

    for (const doc of docs) {
      // Usa solo el texto puro y la fuente para el ID y el embedding
      const id = generateDeterministicUuid(doc.text, doc.source);
      let vector: number[];

      try {
        vector = await this.embeddingClient.embed(doc.text);
      } catch (error: any) {
        console.error('Error generando embedding:', error.message || error);
        continue;
      }

      console.log(`ID generado: ${id} | Texto: ${doc.text} | Fuente: ${doc.source}`);

      // Consulta si el punto ya existe
      let exists = false;
      let needsUpdate = true;
      try {
        const res = await axios.post(`${this.url}/collections/${this.collection}/points/scroll`, {
          filter: { must: [{ key: 'id', match: { value: id } }] },
          limit: 1,
        });
        if (res.data?.result?.points?.length) {
          exists = true;
          const storedText = res.data.result.points[0].payload?.text;
          needsUpdate = storedText !== doc.text;
        }
      } catch (error: any) {
        console.error('Error consultando punto existente:', error.response?.data || error.message);
      }

      // Inserta o actualiza solo si es necesario
      if (!exists || needsUpdate) {
        try {
          await axios.put(`${this.url}/collections/${this.collection}/points`, {
            points: [{
              id,
              vector,
              payload: { text: doc.text, source: doc.source },
            }]
          });
          console.log(`Upserted point ${id} (${exists ? 'updated' : 'inserted'})`);
        } catch (error: any) {
          console.error('Qdrant error:', error.response?.data || error.message);
        }
      } else {
        console.log(`Point ${id} already exists with same text, skipping upsert.`);
      }
    }
  }

  async search(query: string, topK: number) {
    const vector = await this.embeddingClient.embed(query);
    const res = await axios.post(`${this.url}/collections/${this.collection}/points/search`, {
      vector,
      limit: topK,
      with_payload: true
    });
    const hits = res.data?.result || [];
    return hits
    .filter((h: any) => h.payload?.source?.toLowerCase().includes(query.toLowerCase()))
    .map((h: any) => ({
      id: h.id,
      text: h.payload?.text || '',
      source: h.payload?.source || '',
      score: h.score,
    }));
  }
}
