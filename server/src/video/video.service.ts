import { Injectable } from '@nestjs/common';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
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

  private escapeDrawtext(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\n+/g, ' ')
      .trim();
  }

  private buildSubtitleFilters(
    script: { hook: string; body: string; cta: string },
    totalDuration: number,
    inputLabel: string,
    outputLabel: string,
  ): string[] {
    const fontPath = '/System/Library/Fonts/AppleSDGothicNeo.ttc';
    const fontOpt = existsSync(fontPath) ? `fontfile='${fontPath}':` : '';

    const bodyLines = script.body
      .split('\n')
      .filter(l => l.trim())
      .slice(0, 3)
      .map(l => l.replace(/^\d+\.\s*/, ''));

    const segments = [script.hook, ...bodyLines, script.cta]
      .filter(Boolean)
      .map(t => t.replace(/\n+/g, ' ').trim());

    if (segments.length === 0) {
      return [`${inputLabel}copy${outputLabel}`];
    }

    const totalChars = segments.reduce((sum, t) => sum + t.length, 0) || 1;
    let cursor = 0;

    return segments.map((text, i) => {
      const duration = (text.length / totalChars) * totalDuration;
      const start = parseFloat(cursor.toFixed(3));
      const end = parseFloat(Math.min(cursor + duration, totalDuration).toFixed(3));
      cursor += duration;

      const inLabel = i === 0 ? inputLabel : `[dts${i}]`;
      const outLabel = i === segments.length - 1 ? outputLabel : `[dts${i + 1}]`;
      const escaped = this.escapeDrawtext(text);

      return `${inLabel}drawtext=${fontOpt}text='${escaped}':fontsize=44:fontcolor=white:borderw=3:bordercolor=black@0.8:x=(w-text_w)/2:y=h-130:fix_bounds=1:enable='between(t,${start},${end})'${outLabel}`;
    });
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

    const subtitleFilters = this.buildSubtitleFilters(script, totalDuration, '[bg]', '[bgout]');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(bgVideo)
        .input(audio)
        .complexFilter([
          '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[bg]',
          ...subtitleFilters,
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
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }
}
