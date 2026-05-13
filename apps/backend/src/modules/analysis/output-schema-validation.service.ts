import { Injectable } from '@nestjs/common';

export interface OutputSchemaValidationResult {
  isValid: boolean;
  missingFields: string[];
}

@Injectable()
export class OutputSchemaValidationService {
  /**
   * Verifica se un risultato finale contiene i campi richiesti dallo schema utente.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve output finale e schema JSON semplice.
   * Restituisce validita e campi mancanti senza bloccare la campagna.
   */
  validateOutput(output: Record<string, unknown>, outputSchema: Record<string, unknown> | null): OutputSchemaValidationResult {
    if (!outputSchema) {
      return { isValid: true, missingFields: [] };
    }

    const missingFields = Object.keys(outputSchema).filter((fieldName) => output[fieldName] === undefined || output[fieldName] === null);

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}
