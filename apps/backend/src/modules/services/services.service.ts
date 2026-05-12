import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalysisService } from '../analysis/analysis.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysis: AnalysisService
  ) {}

  async get(ownerId: string, id: string) {
    const profile = await this.prisma.serviceProfile.findFirst({
      where: { id, site: { campaign: { ownerId } } },
      include: { site: true, evidenceItems: true, analysisRuns: { orderBy: { createdAt: 'desc' } } }
    });
    if (!profile) {
      throw new NotFoundException('Service profile not found');
    }
    return profile;
  }

  async reanalyze(ownerId: string, id: string) {
    const profile = await this.get(ownerId, id);
    await this.analysis.analyzeSite(profile.siteId);
    return this.get(ownerId, id);
  }
}
