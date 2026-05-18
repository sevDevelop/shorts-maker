import { Injectable } from '@nestjs/common';
import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  summary: string;
  link: string;
  published: string;
  source: string;
}

@Injectable()
export class NewsService {
  private parser = new Parser();

  private categoryMap: Record<string, string> = {
    '기술': 'AI+기술+트렌드',
    '경제': '경제+주식+투자',
    '세계': 'world+news',
    '엔터': '연예+K-pop',
  };

  async fetchNews(category: string, count = 10): Promise<NewsItem[]> {
    const decoded = decodeURIComponent(category);
    const rawQuery = this.categoryMap[decoded] ?? decoded;
    const encodedQuery = rawQuery.split('+').map(t => encodeURIComponent(t)).join('+');
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ko&gl=KR&ceid=KR:ko`;

    try {
      const feed = await this.parser.parseURL(url);
      return feed.items.slice(0, count).map(item => ({
        title: item.title ?? '',
        summary: item.contentSnippet ?? item.content ?? '',
        link: item.link ?? '',
        published: item.pubDate ?? '',
        source: item.creator ?? (item as any)['dc:creator'] ?? '',
      }));
    } catch (err) {
      console.error('[NewsService] fetch error:', err);
      return [];
    }
  }
}
