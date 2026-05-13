import { Module } from '@nestjs/common';
import { AgentRunLogService } from './agent-run-log.service';
import { AiService } from './ai.service';
import { AnalysisService } from './analysis.service';
import { CrawlerService } from './crawler.service';
import { DiscoveryService } from './discovery.service';
import { OutputSchemaValidationService } from './output-schema-validation.service';
import { ResearchAgentService } from './research-agent.service';
import { ResearchPlanningService } from './research-planning.service';
import { ResearchToolRegistryService } from './research-tool-registry.service';
import { ResultMergeAgentService } from './result-merge-agent.service';
import { RulesService } from './rules.service';

@Module({
  providers: [
    AnalysisService,
    DiscoveryService,
    CrawlerService,
    RulesService,
    AiService,
    AgentRunLogService,
    ResearchToolRegistryService,
    ResearchPlanningService,
    ResearchAgentService,
    ResultMergeAgentService,
    OutputSchemaValidationService
  ],
  exports: [AnalysisService, AgentRunLogService, ResearchToolRegistryService]
})
export class AnalysisModule {}
