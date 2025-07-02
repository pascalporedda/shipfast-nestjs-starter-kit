import { IsOptional, IsBoolean, IsString, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileUploadType {
  AVATAR = 'avatar',
  DOCUMENT = 'document',
  IMAGE = 'image',
  ANY = 'any',
}

export class FileUploadDto {
  @ApiPropertyOptional({
    description: 'Type of file upload for validation',
    enum: FileUploadType,
    default: FileUploadType.ANY,
  })
  @IsOptional()
  @IsEnum(FileUploadType)
  type?: FileUploadType = FileUploadType.ANY;

  @ApiPropertyOptional({
    description: 'Folder to upload file to',
    example: 'avatars',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Whether the file should be publicly accessible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({
    description: 'Additional metadata for the file',
    example: { description: 'User profile picture' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class MultipleFileUploadDto extends FileUploadDto {
  @ApiProperty({
    description: 'Array of files to upload',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  files: Express.Multer.File[];
}

export class SingleFileUploadDto extends FileUploadDto {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;
}