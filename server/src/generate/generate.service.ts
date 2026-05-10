import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { VoiceService } from '../voice/voice.service';
import { VideoService } from '../video/video.service';
import { ProgressService } from '../progress/progress.service';

interface GenerateDto {
  jobId: string;
  script: { hook: string; body: string; cta: string; bg_keyword: string; full_script: string };
  videoUrl: string;
  audioType: 'ai' | 'upload';
  uploadedAudioPath?: string;
  voice?: string;
}

@Injectable()
export class GenerateService {
  constructor(
    private voiceService: VoiceService,
    private videoService: VideoService,
    private progressService: ProgressService,
  ) {}

  async run(dto: GenerateDto): Promise<string> {
    const { jobId, script, videoUrl, audioType, uploadedAudioPath, voice } = dto;
    const outputDir = join(__dirname, '..', '..', 'output');
    const tempDir = join(__dirname, '..', '..', 'temp');
    [outputDir, tempDir].forEach(d => { if (!existsSync(d)) mkdirSync(d, { recursive: true }); });

    try {
      this.progressService.update(jobId, 15, '스크립트 준비 중...');

      // Download background video
      this.progressService.update(jobId, 30, '배경 영상 다운로드 중...');
      const bgVideoPath = join(tempDir, `${jobId}_bg.mp4`);
      await this.videoService.downloadVideo(videoUrl, bgVideoPath);

      // Generate or use audio
      this.progressService.update(jobId, 50, '오디오 준비 중...');
      let audioPath: string;
      if (audioType === 'ai') {
        audioPath = join(tempDir, `${jobId}_voice.mp3`);
        await this.voiceService.generateVoice(
          script.full_script,
          audioPath,
          voice ?? 'ko-KR-SunHiNeural',
        );
      } else {
        audioPath = uploadedAudioPath!;
      }

      // Generate subtitle SRT
      this.progressService.update(jobId, 70, '자막 생성 중...');

      // FFmpeg synthesis
      this.progressService.update(jobId, 85, '영상 합성 중...');
      const outputPath = join(outputDir, `${jobId}.mp4`);
      await this.videoService.createShorts(
        bgVideoPath,
        audioPath,
        script,
        outputPath,
        (pct) => this.progressService.update(jobId, pct, '영상 합성 중...'),
      );

      // Cleanup temp files
      try {
        const { unlinkSync } = require('fs');
        unlinkSync(bgVideoPath);
        if (audioType === 'ai') unlinkSync(audioPath);
      } catch {}

      this.progressService.update(jobId, 100, '완료!');
      this.progressService.complete(jobId);
      return `${jobId}.mp4`;
    } catch (err) {
      this.progressService.error(jobId, (err as Error).message ?? '오류가 발생했습니다.');
      throw err;
    }
  }
}
