import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EmbeddingClient } from '../../domain/embedding-client.interface';

// Cliente de embedding que utiliza la API de OpenAI para generar vectores de texto.
@Injectable()
export class OpenAiEmbeddingClient implements EmbeddingClient {

  // Obtiene el embedding de un texto llamando a la API de OpenAI y retorna el vector numérico.
  async embed(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      { input: text, model: 'text-embedding-3-small' },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return response.data.data[0].embedding;
  }
}