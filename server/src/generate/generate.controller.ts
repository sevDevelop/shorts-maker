import { Controller, Post, Body, Get, Param, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GenerateService } from './generate.service';
import { ProgressService } from '../progress/progress.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('generate')
export class GenerateController {
  constructor(
    private generateService: GenerateService,
    private progressService: ProgressService,
  ) {}

  @Post()
  async startGenerate(@Body() body: any) {
    const jobId = body.jobId ?? uuidv4();
    this.progressService.create(jobId);

    // Run in background
    this.generateService
      .run({ ...body, jobId })
      .catch(() => {});

    return { jobId };
  }

  @Sse('progress/:jobId')
  getProgress(@Param('jobId') jobId: string): Observable<{ data: any }> {
    return this.progressService.create(jobId);
  }
}
