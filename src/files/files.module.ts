import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FilesController } from './files.controller';
import { FileUploadService } from './services/file-upload.service';
import { FileValidationService } from './services/file-validation.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      // Use memory storage for processing
      // Files will be uploaded to S3 after validation
      storage: undefined, // Default memory storage
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB default limit
        files: 10, // Maximum 10 files at once
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FileUploadService, FileValidationService, PrismaService],
  exports: [FileUploadService, FileValidationService],
})
export class FilesModule {}