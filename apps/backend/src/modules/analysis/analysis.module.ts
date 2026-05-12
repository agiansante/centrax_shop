import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnalysisService } from './analysis.service';
import { CrawlerService } from './crawler.service';
import { DiscoveryService } from './discovery.service';
import { RulesService } from './rules.service';

@Module({
  providers: [AnalysisService, DiscoveryService, CrawlerService, RulesService, AiService],
  exports: [AnalysisService]
})
export class AnalysisModule {}
