// Interface que representa el resultado de una búsqueda semántica en Qdrant.
export interface QdrantSearchResult {
    id: string;
    text: string;
    source: string;
    score: number;
    metadata: string;
}