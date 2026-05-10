import { Module } from '@nestjs/common';
import { NewsModule } from './news/news.module';
import { ScriptModule } from './script/script.module';
import { VoiceModule } from './voice/voice.module';
import { VideoModule } from './video/video.module';
import { GenerateModule } from './generate/generate.module';
import { ProgressModule } from './progress/progress.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    NewsModule,
    ScriptModule,
    VoiceModule,
    VideoModule,
    GenerateModule,
    ProgressModule,
    UploadModule,
  ],
})
export class AppModule {}
