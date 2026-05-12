import { describe, expect, it } from 'vitest';
import {
  extractComparableDomain,
  keepFirstItemForEachDomain,
  normalizeUrlForStorage
} from '../src/modules/analysis/url-normalization.utils';

describe('url utilities', () => {
  it('normalizes urls', () => {
    expect(normalizeUrlForStorage('www.example.com/path/?a=1#top')).toBe('https://www.example.com/path');
  });

  it('extracts root-ish domains', () => {
    expect(extractComparableDomain('https://www.shop.example/path')).toBe('shop.example');
  });

  it('deduplicates by domain', () => {
    expect(keepFirstItemForEachDomain([{ url: 'https://a.test' }, { url: 'https://www.a.test/path' }, { url: 'https://b.test' }])).toHaveLength(2);
  });
});
