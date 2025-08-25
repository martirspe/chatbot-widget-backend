import { Module } from '@nestjs/common';
import { RagService } from './application/rag.service';
import { QdrantStore } from './infrastructure/vector/qdrant.store';
import { OpenAiClient } from './infrastructure/llm/openai.client';
import { OpenAiEmbeddingClient } from './infrastructure/embedding/openai-embedding.client';
import { DummyEmbeddingClient } from './infrastructure/embedding/dummy-embedding.client';

const embeddingProvider = process.env.OPENAI_API_KEY
  ? { provide: 'EmbeddingClient', useClass: OpenAiEmbeddingClient }
  : { provide: 'EmbeddingClient', useClass: DummyEmbeddingClient };

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
export class RagModule {}
