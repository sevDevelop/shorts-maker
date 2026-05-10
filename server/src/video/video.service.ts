import { Injectable } from '@nestjs/common';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

export interface VideoItem {
  id: number;
  url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
}

@Injectable()
export class VideoService {
  private pexelsKey = process.env.PEXELS_API_KEY ?? '';

  async searchVideos(keyword: string, count = 3): Promise<VideoItem[]> {
    const res = await axios.get('https://api.pexels.com/videos/search', {
      headers: { Authorization: this.pexelsKey },
      params: { query: keyword, orientation: 'portrait', per_page: count, size: 'medium' },
    });

    return res.data.videos.map((v: any) => ({
      id: v.id,
      url: v.video_files.find((f: any) => f.quality === 'sd')?.link ?? v.video_files[0]?.link,
      thumbnail: v.image,
      duration: v.duration,
      width: v.width,
      height: v.height,
    }));
  }

  async downloadVideo(videoUrl: string, outputPath: string): Promise<string> {
    const res = await axios.get(videoUrl, { responseType: 'stream' });
    const writer = createWriteStream(outputPath);
    await pipeline(res.data, writer);
    return outputPath;
  }

  generateSrtContent(script: { hook: string; body: string; cta: string }): string {
    const lines: string[] = [];
    let idx = 1;

    const addEntry = (start: string, end: string, text: string) => {
      lines.push(`${idx++}\n${start} --> ${end}\n${text}\n`);
    };

    addEntry('00:00:00,000', '00:00:04,000', script.hook);

    const bodyLines = script.body
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 3);

    const timings = [
      ['00:00:05,000', '00:00:20,000'],
      ['00:00:21,000', '00:00:36,000'],
      ['00:00:37,000', '00:00:52,000'],
    ];

    bodyLines.forEach((line, i) => {
      const t = timings[i];
      if (t) addEntry(t[0], t[1], line.replace(/^\d+\.\s*/, ''));
    });

    addEntry('00:00:53,000', '00:01:00,000', script.cta);

    return lines.join('\n');
  }

  async createShorts(
    bgVideo: string,
    audio: string,
    script: { hook: string; body: string; cta: string },
    outputPath: string,
    onProgress: (percent: number) => void,
  ): Promise<string> {
    const tempDir = join(__dirname, '..', '..', 'temp');
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    const srtPath = join(tempDir, `${Date.now()}.srt`);
    writeFileSync(srtPath, this.generateSrtContent(script), 'utf8');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(bgVideo)
        .input(audio)
        .complexFilter([
          '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[bg]',
          '[0:a]volume=0.08[bgaudio]',
          '[1:a]volume=1.0[voice]',
          '[bgaudio][voice]amix=inputs=2:duration=first[audio]',
        ])
        .outputOptions([
          '-map [bg]',
          '-map [audio]',
          `-vf subtitles=${srtPath}:force_style='FontSize=52,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=3,Bold=1,Alignment=2,MarginV=80'`,
          '-t 60',
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-r 30',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('progress', (p) => {
          const pct = Math.min(Math.round((p.percent ?? 0) * 0.3 + 55), 85);
          onProgress(pct);
        })
        .on('end', () => {
          try { require('fs').unlinkSync(srtPath); } catch {}
          resolve(outputPath);
        })
        .on('error', reject)
        .run();
    });
  }
}
