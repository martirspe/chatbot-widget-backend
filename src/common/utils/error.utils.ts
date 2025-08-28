// Formatea cualquier error en un mensaje legible para logging y respuesta.
export function formatError(error: any): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}