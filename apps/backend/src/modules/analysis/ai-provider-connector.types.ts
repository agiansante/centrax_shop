import { ExtractedEvidence } from './rules.service';
import { AiServiceProfile } from './ai.service';

export interface AiProviderAnalyzeInput {
  domain: string;
  title?: string;
  evidence: ExtractedEvidence[];
}

export interface AiProviderConnector {
  name: string;
  configured: boolean;
  modelName(): string;
  analyzeProviderInput(input: AiProviderAnalyzeInput): Promise<AiServiceProfile>;
}
