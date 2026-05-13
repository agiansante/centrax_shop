import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ResearchConfigurationService } from './research-configuration.service';

@ApiTags('research-configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('research-configuration')
export class ResearchConfigurationController {
  constructor(private readonly configuration: ResearchConfigurationService) {}

  /**
   * Mostra provider ricerca, provider AI e tool disponibili senza segreti.
   *
   * Usata da:
   * - apps/frontend/src/ui/ConfigurationPage.tsx
   *
   * Non riceve input e restituisce lo stato di configurazione del cervello ricerca.
   */
  @Get()
  getConfiguration() {
    return this.configuration.getConfigurationSummary();
  }
}
