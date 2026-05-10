import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { VoiceModule } from '../voice/voice.module';
import { VideoModule } from '../video/video.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [VoiceModule, VideoModule, ProgressModule],
  controllers: [GenerateController],
  providers: [GenerateService],
})
export class GenerateModule {}
