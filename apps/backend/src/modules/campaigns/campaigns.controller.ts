import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { JwtUser } from '../auth/jwt.strategy';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignRequestDto } from './create-campaign-request.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  /**
   * Crea una campagna di ricerca per l'utente autenticato.
   *
   * Usata da:
   * - apps/frontend/src/ui/DashboardPage.tsx
   *
   * Riceve query e parametri opzionali dal body HTTP.
   */
  create(@Req() request: Request & { user: JwtUser }, @Body() dto: CreateCampaignRequestDto) {
    return this.campaigns.create(request.user.userId, dto);
  }

  /**
   * Restituisce tutte le campagne dell'utente autenticato.
   *
   * Usata da:
   * - apps/frontend/src/ui/DashboardPage.tsx
   *
   * Riceve l'id utente dal JWT.
   */
  @Get()
  list(@Req() request: Request & { user: JwtUser }) {
    return this.campaigns.list(request.user.userId);
  }

  /**
   * Restituisce una singola campagna con i siti gia scoperti.
   *
   * Usata da:
   * - schermate di dettaglio campagna o debug.
   *
   * Riceve id campagna dalla route.
   */
  @Get(':id')
  get(@Req() request: Request & { user: JwtUser }, @Param('id') id: string) {
    return this.campaigns.get(request.user.userId, id);
  }

  /**
   * Mette in coda l'esecuzione asincrona della campagna.
   *
   * Usata da:
   * - apps/frontend/src/ui/DashboardPage.tsx
   *
   * Riceve id campagna dalla route e lo passa alla coda BullMQ.
   */
  @Post(':id/run')
  run(@Req() request: Request & { user: JwtUser }, @Param('id') id: string) {
    return this.campaigns.run(request.user.userId, id);
  }

  /**
   * Restituisce i risultati analizzati di una campagna.
   *
   * Usata da:
   * - apps/frontend/src/ui/CampaignDetailPage.tsx
   *
   * Include profili servizio, evidenze e run di analisi.
   */
  @Get(':id/results')
  results(@Req() request: Request & { user: JwtUser }, @Param('id') id: string) {
    return this.campaigns.results(request.user.userId, id);
  }
}
