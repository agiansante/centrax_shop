import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Rappresenta i dati inviati dal frontend per creare una campagna di ricerca.
 *
 * Usata da:
 * - apps/backend/src/modules/campaigns/campaigns.controller.ts
 * - apps/backend/src/modules/campaigns/campaigns.service.ts
 *
 * Contiene la query principale e alcuni parametri opzionali per guidare
 * discovery, crawling e analisi.
 */
export class CreateCampaignRequestDto {
  @ApiProperty({ example: 'Trova venditori di macchine luxury usate in Lombardia con contatti verificabili.' })
  @IsString()
  userRequest!: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  searchPrompt?: string;

  @IsOptional()
  @IsObject()
  outputSchema?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  approvedResearchPlan?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  depth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxResults?: number;
}

/**
 * Rappresenta la richiesta per preparare o rivedere un piano campagna.
 *
 * Usata da:
 * - apps/backend/src/modules/campaigns/campaigns.controller.ts
 * - apps/frontend/src/ui/DashboardPage.tsx
 *
 * Riceve la richiesta naturale dell'utente, i limiti di ricerca e una eventuale
 * istruzione di revisione del piano gia generato.
 */
export class PreviewCampaignPlanRequestDto {
  @ApiProperty({ example: 'Trova venditori di macchine luxury usate in Lombardia con contatti verificabili.' })
  @IsString()
  userRequest!: string;

  @IsOptional()
  @IsObject()
  currentPlan?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  revisionRequest?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  depth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxResults?: number;
}
