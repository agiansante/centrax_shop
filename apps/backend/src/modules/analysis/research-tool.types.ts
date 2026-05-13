export interface ResearchToolDescriptor {
  name: string;
  description: string;
  configured: boolean;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface ResearchToolExecutionResult {
  toolName: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface ResearchTool<TInput = unknown, TOutput = unknown> {
  descriptor: ResearchToolDescriptor;
  execute(input: TInput): Promise<ResearchToolExecutionResult & { data?: TOutput }>;
}
