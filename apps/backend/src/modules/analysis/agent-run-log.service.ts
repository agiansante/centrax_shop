import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAgentLogEntryInput {
  campaignId: string;
  step: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AgentRunLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento leggibile del lavoro dell'agente ricerca.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve id campagna, fase, messaggio e metadati opzionali.
   * Restituisce il log salvato nel database.
   */
  createLogEntry(input: CreateAgentLogEntryInput) {
    return this.prisma.agentRunLog.create({
      data: {
        campaignId: input.campaignId,
        step: input.step,
        message: input.message,
        level: input.level ?? 'info',
        metadata: input.metadata ?? Prisma.JsonNull
      }
    });
  }

  /**
   * Carica i log agente ordinati per data di creazione.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.service.ts
   *
   * Riceve id campagna e restituisce gli eventi mostrabili nel terminale frontend.
   */
  listLogsForCampaign(campaignId: string) {
    return this.prisma.agentRunLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Elimina i log precedenti prima di rilanciare una campagna.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.service.ts
   *
   * Riceve id campagna e pulisce solo la cronologia dell'agente collegata.
   */
  clearLogsForCampaign(campaignId: string) {
    return this.prisma.agentRunLog.deleteMany({ where: { campaignId } });
  }
}
