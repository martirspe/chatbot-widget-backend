export interface LLMClient {
  generate(prompt: string, context: string[]): Promise<string>;
}
