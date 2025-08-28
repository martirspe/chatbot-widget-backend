import { Module } from '@nestjs/common';
import { RagService } from './application/rag.service';
import { QdrantStore } from './infrastructure/vector/qdrant.store';
import { OpenAiClient } from './infrastructure/llm/openai.client';
import { OpenAiEmbeddingClient } from './infrastructure/embedding/openai-embedding.client';
import { LocalEmbeddingClient } from './infrastructure/embedding/local-embedding-client';

// Selecciona el proveedor de embeddings según la disponibilidad de la API key de OpenAI.
const embeddingProvider = process.env.OPENAI_API_KEY
  ? { provide: 'EmbeddingClient', useClass: OpenAiEmbeddingClient }
  : { provide: 'EmbeddingClient', useClass: LocalEmbeddingClient };

// Módulo RAG que agrupa servicios y clientes para búsqueda semántica y generación de texto.
@Module({
  providers: [
    RagService,
    { provide: 'VectorStore', useClass: QdrantStore },
    { provide: 'LLMClient', useClass: OpenAiClient },
    { provide: 'RagService', useExisting: RagService },
    embeddingProvider,
  ],
  exports: [RagService, 'VectorStore', 'EmbeddingClient'],
})
export class RagModule { }
