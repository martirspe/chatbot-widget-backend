import { Injectable } from '@nestjs/common';
import { EmbeddingClient } from '../../domain/embedding-client.interface';

@Injectable()
export class DummyEmbeddingClient implements EmbeddingClient {
  embed(text: string): Promise<number[]> {
    // Vector de tamaño 1536 con valores fijos para pruebas
    return Promise.resolve(Array(1536).fill(0.1));
  }
}