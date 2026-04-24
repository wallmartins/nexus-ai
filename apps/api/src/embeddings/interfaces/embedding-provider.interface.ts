export interface EmbeddingProvider {
  readonly providerName: string;
  readonly dimension: number;

  embed(texts: string[], model: string): Promise<number[][]>;
}
