import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResearchConfigurationModule } from './research-configuration/research-configuration.module';
import { ServicesModule } from './services/services.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CampaignsModule,
    ResearchConfigurationModule,
    ServicesModule,
    WorkersModule,
    HealthModule
  ]
})
export class AppModule {}
