import { Injectable } from '@nestjs/common';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { createWriteStream } from 'fs';
import { join } from 'path';

@Injectable()
export class VoiceService {
  async generateVoice(
    text: string,
    outputPath: string,
    voice = 'ko-KR-SunHiNeural',
  ): Promise<string> {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(text);
    const writeStream = createWriteStream(outputPath);

    await new Promise<void>((resolve, reject) => {
      audioStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return outputPath;
  }

  getAvailableVoices() {
    return [
      { id: 'ko-KR-SunHiNeural', name: '선희 (여성, 밝음)', gender: 'female' },
      { id: 'ko-KR-InJoonNeural', name: '인준 (남성, 차분)', gender: 'male' },
    ];
  }
}
