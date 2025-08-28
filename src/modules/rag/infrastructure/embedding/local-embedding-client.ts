import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { EmbeddingClient } from '../../domain/embedding-client.interface';
import { formatError } from '../../../../common/utils/error.utils';

// Cliente de embeddings local usando microservicio Python con sentence-transformers.
@Injectable()
export class LocalEmbeddingClient implements EmbeddingClient {
    constructor(private readonly config: ConfigService) { }

    async embed(text: string): Promise<number[]> {
        const url = this.config.get<string>('localEmbeddingUrl');
        if (!url) {
            throw new Error(formatError('La variable de entorno LOCAL_EMBEDDING_URL no está definida'));
        }
        try {
            const response = await axios.post(url, { text });
            return response.data.embedding;
        } catch (error) {
            throw new Error(formatError(error));
        }
    }
}