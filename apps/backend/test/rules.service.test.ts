import { describe, expect, it } from 'vitest';
import { RulesService } from '../src/modules/analysis/rules.service';

describe('RulesService', () => {
  it('extracts Shopify and pricing evidence', () => {
    const rules = new RulesService();
    const evidence = rules.extract('Our Shopify app connects your store. Pricing starts at $29 monthly.', 'https://example.test');
    expect(evidence.map((item) => item.type)).toContain('SHOPIFY');
    expect(evidence.map((item) => item.type)).toContain('PRICING');
  });
});
