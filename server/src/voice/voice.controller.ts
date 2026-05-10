import { Controller, Get } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voices')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get()
  getVoices() {
    return this.voiceService.getAvailableVoices();
  }
}
