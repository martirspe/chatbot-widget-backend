// Interface para el almacenamiento y búsqueda de vectores en el store.
export interface VectorStore {

  // Inserta o actualiza documentos vectorizados.
  upsert(docs: { id: string; text: string }[]): Promise<void>;

  // Busca los documentos más relevantes para una consulta.
  search(query: string, topK: number, minScore: number, source?: string): Promise<{ id: string; text: string; score: number; metadata?: any }[]>;
}
