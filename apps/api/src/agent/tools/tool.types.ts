export type ToolInput = {
  query: string;
  correlationId: string;
};

export type ToolResult = {
  toolName: string;
  output: unknown;
  error?: string;
};

export type Tool = {
  readonly name: string;
  invoke(input: ToolInput): Promise<ToolResult>;
};
