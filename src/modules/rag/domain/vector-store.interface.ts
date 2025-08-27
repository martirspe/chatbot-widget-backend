export interface VectorStore {
  upsert(docs: { id: string; text: string }[]): Promise<void>;
  search(query: string, topK: number): Promise<{ id: string; text: string; score: number }[]>;
}
