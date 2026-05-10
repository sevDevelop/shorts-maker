import { Controller, Post, Body } from '@nestjs/common';
import { ScriptService } from './script.service';

@Controller('script')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Post()
  async generateScript(@Body() body: { topic: string }) {
    return this.scriptService.generateScript(body.topic);
  }
}
