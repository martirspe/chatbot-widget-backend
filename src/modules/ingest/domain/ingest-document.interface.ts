// Interface que representa la estructura de un documento a ingresar en el vector store.
export interface IngestDocument {
  id: string;
  text: string;
  source?: string;
  timestamp: string;
}