import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, IsDateString } from 'class-validator';

export class FileResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the file',
    example: 'cuid123456789',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Generated filename',
    example: 'abc123-def456.jpg',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Original filename from upload',
    example: 'my-photo.jpg',
  })
  @IsString()
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description: 'Public URL to access the file',
    example: 'https://cdn.example.com/uploads/abc123-def456.jpg',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'S3 object key',
    example: 'uploads/abc123-def456.jpg',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Storage bucket name',
    example: 'my-app-uploads',
  })
  @IsString()
  bucket: string;

  @ApiProperty({
    description: 'Whether the file is publicly accessible',
    example: true,
  })
  @IsBoolean()
  isPublic: boolean;

  @ApiPropertyOptional({
    description: 'ID of the user who uploaded the file',
    example: 'user123456789',
  })
  @IsOptional()
  @IsString()
  userId?: string | null;

  @ApiPropertyOptional({
    description: 'Additional file metadata',
    example: { description: 'Profile picture', tags: ['avatar', 'user'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({
    description: 'When the file was uploaded',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    description: 'When the file was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  updatedAt: Date;
}

export class FileListResponseDto {
  @ApiProperty({
    description: 'Array of files',
    type: [FileResponseDto],
  })
  files: FileResponseDto[];

  @ApiProperty({
    description: 'Total number of files',
    example: 50,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  @IsNumber()
  pages: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Number of files per page',
    example: 10,
  })
  @IsNumber()
  limit: number;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'File uploaded successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Uploaded file information',
    type: FileResponseDto,
  })
  file: FileResponseDto;
}

export class MultipleFileUploadResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Files uploaded successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Array of uploaded files information',
    type: [FileResponseDto],
  })
  files: FileResponseDto[];

  @ApiProperty({
    description: 'Number of successfully uploaded files',
    example: 3,
  })
  @IsNumber()
  uploadedCount: number;
}