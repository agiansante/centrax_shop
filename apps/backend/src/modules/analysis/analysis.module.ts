import { Module } from '@nestjs/common';
import { AgentRunLogService } from './agent-run-log.service';
import { AiService } from './ai.service';
import { AnalysisService } from './analysis.service';
import { CrawlerService } from './crawler.service';
import { DiscoveryService } from './discovery.service';
import { DiscoveryPreFilterService } from './discovery-pre-filter.service';
import { OutputSchemaValidationService } from './output-schema-validation.service';
import { ResearchAgentService } from './research-agent.service';
import { ResearchIntentBuilderService } from './research-intent-builder.service';
import { ResearchPlanningService } from './research-planning.service';
import { ResearchToolRegistryService } from './research-tool-registry.service';
import { ResultMergeAgentService } from './result-merge-agent.service';
import { RulesService } from './rules.service';

@Module({
  providers: [
    AnalysisService,
    DiscoveryService,
    DiscoveryPreFilterService,
    CrawlerService,
    RulesService,
    AiService,
    AgentRunLogService,
    ResearchIntentBuilderService,
    ResearchToolRegistryService,
    ResearchPlanningService,
    ResearchAgentService,
    ResultMergeAgentService,
    OutputSchemaValidationService
  ],
  exports: [AnalysisService, AgentRunLogService, ResearchToolRegistryService, ResearchIntentBuilderService]
})
export class AnalysisModule {}
