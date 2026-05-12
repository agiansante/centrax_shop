import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { normalizeUrlForStorage } from './url-normalization.utils';

export interface CrawledPage {
  url: string;
  title?: string;
  text: string;
  links: string[];
}

const PAGE_HINTS = ['pricing', 'docs', 'documentation', 'integrations', 'shopify', 'api'];

@Injectable()
export class CrawlerService {
  constructor(private readonly config: ConfigService) {}

  async crawl(seedUrl: string, depth: number): Promise<CrawledPage[]> {
    const maxPages = Math.min(this.config.get<number>('CRAWL_MAX_PAGES') ?? 4, Math.max(1, depth + 1));
    const visited = new Set<string>();
    const queue = [normalizeUrlForStorage(seedUrl)];
    const pages: CrawledPage[] = [];

    while (queue.length > 0 && pages.length < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) {
        continue;
      }
      visited.add(url);

      const page = await this.fetchPage(url);
      if (!page) {
        continue;
      }
      pages.push(page);

      if (pages.length < maxPages) {
        for (const link of this.extractCandidateLinks(page.links.join(' '), url)) {
          if (!visited.has(link)) {
            queue.push(link);
          }
        }
      }
    }

    return pages;
  }

  private async fetchPage(url: string): Promise<CrawledPage | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.get<number>('CRAWL_TIMEOUT_MS') ?? 12000);
      const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'DropshipIntelBot/0.1' } });
      clearTimeout(timeout);
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      $('script, style, noscript, svg').remove();
      const title = $('title').first().text().trim();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000);
      const links = $('a[href]')
        .map((_, element) => $(element).attr('href'))
        .get();
      return { url, title, text: bodyText, links };
    } catch {
      return null;
    }
  }

  private extractCandidateLinks(text: string, baseUrl: string): string[] {
    const base = new URL(baseUrl);
    return text
      .split(/\s+/)
      .map((href) => {
        try {
          const url = new URL(href, base);
          if (url.hostname !== base.hostname) {
            return null;
          }
          return normalizeUrlForStorage(url.toString());
        } catch {
          return null;
        }
      })
      .filter((url): url is string => Boolean(url))
      .filter((url) => PAGE_HINTS.some((hint) => url.toLowerCase().includes(hint)));
  }
}
