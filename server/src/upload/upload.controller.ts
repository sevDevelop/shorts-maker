import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('upload-audio')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.mp3', '.wav', '.m4a'];
        cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
      },
    }),
  )
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    return { path: `/uploads/${file.filename}`, filename: file.filename };
  }
}
