import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
  @ApiProperty({ example: 'dropshipping suppliers with Shopify integration' })
  @IsString()
  query!: string;

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
