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

  private toSrtTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  generateSrtContent(script: { hook: string; body: string; cta: string }, totalDuration: number): string {
    const bodyLines = script.body
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 3)
      .map(l => l.replace(/^\d+\.\s*/, ''));

    const segments = [script.hook, ...bodyLines, script.cta].filter(Boolean);
    const totalChars = segments.reduce((sum, t) => sum + t.length, 0) || 1;

    const entries: string[] = [];
    let idx = 1;
    let cursor = 0;

    for (const text of segments) {
      const segDuration = (text.length / totalChars) * totalDuration;
      const start = cursor;
      const end = Math.min(cursor + segDuration, totalDuration);
      entries.push(`${idx++}\n${this.toSrtTime(start)} --> ${this.toSrtTime(end)}\n${text}\n`);
      cursor = end;
      if (cursor >= totalDuration) break;
    }

    return entries.join('\n');
  }

  private getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration ?? 60);
      });
    });
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

    const audioDuration = await this.getAudioDuration(audio);
    const totalDuration = Math.min(audioDuration, 60);

    const srtPath = join(tempDir, `${Date.now()}.srt`);
    writeFileSync(srtPath, this.generateSrtContent(script, totalDuration), 'utf8');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(bgVideo)
        .input(audio)
        .complexFilter([
          '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[bg]',
          `[bg]subtitles=filename='${srtPath}':force_style='FontSize=52,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=3,Bold=1,Alignment=2,MarginV=80'[bgout]`,
          '[0:a]volume=0.08[bgaudio]',
          '[1:a]volume=1.0[voice]',
          '[bgaudio][voice]amix=inputs=2:duration=longest[audio]',
        ])
        .outputOptions([
          '-map [bgout]',
          '-map [audio]',
          `-t ${totalDuration}`,
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
