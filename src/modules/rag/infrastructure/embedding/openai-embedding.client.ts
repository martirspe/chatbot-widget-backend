import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EmbeddingClient } from '../../domain/embedding-client.interface';

@Injectable()
export class OpenAiEmbeddingClient implements EmbeddingClient {
  async embed(text: string): Promise<number[]> {
    // Implementa la llamada real a OpenAI aquí
    // Ejemplo simplificado:
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      { input: text, model: 'text-embedding-ada-002' },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return response.data.data[0].embedding;
  }
}