// Interface para clientes de embeddings que generan vectores numéricos a partir de texto.
export interface EmbeddingClient {
  embed(text: string): Promise<number[]>;
}