export interface NewsItem {
  title: string;
  summary: string;
  link: string;
  published: string;
  source: string;
}

export interface ScriptResult {
  hook: string;
  body: string;
  cta: string;
  title: string;
  tags: string;
  caption: string;
  bg_keyword: string;
  full_script: string;
}

export interface VideoItem {
  id: number;
  url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
}

export type Section = 'news' | 'script' | 'video' | 'complete';
