// Enum que define los modos de operación del servicio RAG: solo LLM, solo Qdrant o ambos.
export enum RagMode {
  LLM = 'llm',
  QDRANT = 'qdrant',
  BOTH = 'both',
}