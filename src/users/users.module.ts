import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { FileUploadService } from '../files/services/file-upload.service';
import { FileValidationService } from '../files/services/file-validation.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: undefined, // Use memory storage
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB for avatars
        files: 1,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    FileUploadService,
    FileValidationService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
