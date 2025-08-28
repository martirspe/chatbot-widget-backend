// Interface para clientes LLM que generan texto a partir de un prompt y contexto adicional.
export interface LLMClient {
  generate(prompt: string, context: string[]): Promise<string>;
}
