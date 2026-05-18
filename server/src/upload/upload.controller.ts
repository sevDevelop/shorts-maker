import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

@Controller('upload-audio')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.mp3', '.wav', '.m4a'];
        cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
      },
    }),
  )
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    return { path: file.path, filename: file.filename };
  }
}
