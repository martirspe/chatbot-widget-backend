import { Injectable } from '@nestjs/common';
import { EmbeddingClient } from '@modules/rag/domain/embedding-client.interface';

// Cliente de embedding de prueba que retorna un vector fijo para simular el comportamiento de un modelo real.
@Injectable()
export class DummyEmbeddingClient implements EmbeddingClient {
  
  // Genera un embedding fijo de tamaño 1536 para cualquier texto, útil en pruebas y desarrollo.
  embed(text: string): Promise<number[]> {
    return Promise.resolve(Array(1536).fill(0.1));
  }
}