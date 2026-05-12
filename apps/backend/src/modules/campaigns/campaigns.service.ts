import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignQueueService } from '../queue/queue.service';
import { CreateCampaignRequestDto } from './create-campaign-request.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: CampaignQueueService
  ) {}

  /**
   * Salva una nuova campagna in stato bozza per l'utente autenticato.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.controller.ts
   *
   * Riceve ownerId dal JWT e dati campagna dal DTO.
   */
  create(ownerId: string, dto: CreateCampaignRequestDto) {
    return this.prisma.searchCampaign.create({
      data: {
        ownerId,
        query: dto.query,
        country: dto.country,
        language: dto.language ?? 'it',
        depth: dto.depth ?? 2,
        maxResults: dto.maxResults ?? 10,
        progressStep: 'draft',
        progressMessage: 'Campagna creata. Avviala per iniziare la ricerca.'
      }
    });
  }

  /**
   * Carica l'elenco campagne dell'utente con il conteggio dei siti scoperti.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.controller.ts
   *
   * Riceve ownerId dal JWT.
   */
  list(ownerId: string) {
    return this.prisma.searchCampaign.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { discoveredSites: true }
        }
      }
    });
  }

  /**
   * Carica una campagna specifica verificando che appartenga all'utente.
   *
   * Usata da:
   * - run nello stesso service.
   * - results nello stesso service.
   * - apps/backend/src/modules/campaigns/campaigns.controller.ts
   *
   * Riceve ownerId e id campagna.
   */
  async get(ownerId: string, id: string) {
    const campaign = await this.prisma.searchCampaign.findFirst({
      where: { id, ownerId },
      include: {
        discoveredSites: {
          include: { profile: true },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  /**
   * Marca la campagna come accodata e inserisce il job nella coda Redis.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.controller.ts
   *
   * Riceve ownerId per autorizzazione e id campagna da avviare.
   */
  async run(ownerId: string, id: string) {
    await this.get(ownerId, id);
    const campaign = await this.prisma.searchCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.QUEUED,
        error: null,
        progressStep: 'queued',
        progressMessage: 'Campagna inserita in coda. Il worker la prenderà in carico a breve.',
        discoveredCount: 0,
        analyzedCount: 0,
        failedCount: 0,
        startedAt: null,
        completedAt: null
      }
    });
    await this.queue.enqueueCampaign(id);
    return campaign;
  }

  /**
   * Carica i siti scoperti e i profili analizzati per una campagna.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.controller.ts
   *
   * Riceve ownerId per autorizzazione e id campagna.
   */
  async results(ownerId: string, id: string) {
    await this.get(ownerId, id);
    return this.prisma.discoveredSite.findMany({
      where: { campaignId: id },
      include: {
        profile: {
          include: { evidenceItems: true, analysisRuns: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
