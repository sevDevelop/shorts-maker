import { Controller, Post, Body } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async searchVideos(@Body() body: { keyword: string }) {
    return this.videoService.searchVideos(body.keyword);
  }
}
