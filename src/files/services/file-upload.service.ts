import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../../database/prisma.service';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadOptions {
  userId?: string;
  bucket?: string;
  folder?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface UploadedFileInfo {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  key: string;
  bucket: string;
  isPublic: boolean;
  userId?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly cdnUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.bucket = this.configService.get<string>('digitalOcean.spaces.bucket')!;
    this.region = this.configService.get<string>('digitalOcean.spaces.region')!;
    this.endpoint = this.configService.get<string>('digitalOcean.spaces.endpoint')!;
    this.cdnUrl = this.configService.get<string>('digitalOcean.spaces.cdnUrl')!;

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('digitalOcean.spaces.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('digitalOcean.spaces.secretAccessKey')!,
      },
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
    });
  }

  /**
   * Upload a single file to DigitalOcean Spaces
   */
  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadedFileInfo> {
    try {
      // Generate unique filename
      const fileExtension = this.getFileExtension(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const folder = options.folder || 'uploads';
      const key = `${folder}/${fileName}`;

      // Validate file type
      const detectedType = await fileTypeFromBuffer(file.buffer);
      const mimeType = detectedType?.mime || file.mimetype;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: options.bucket || this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: mimeType,
        ACL: options.isPublic !== false ? 'public-read' : 'private',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: options.userId || 'anonymous',
          ...options.metadata,
        },
      });

      await this.s3Client.send(uploadCommand);

      // Generate public URL
      const url = this.generatePublicUrl(key, options.bucket);

      // Save file info to database
      const fileRecord = await this.prisma.file.create({
        data: {
          fileName,
          originalName: file.originalname,
          mimeType,
          fileSize: file.size,
          url,
          key,
          bucket: options.bucket || this.bucket,
          isPublic: options.isPublic !== false,
          userId: options.userId,
          metadata: options.metadata,
        },
      });

      this.logger.log(`File uploaded successfully: ${key}`);

      return fileRecord;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    options: FileUploadOptions = {},
  ): Promise<UploadedFileInfo[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from both S3 and database
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found');
      }

      // Check if user owns the file (if userId provided)
      if (userId && file.userId !== userId) {
        throw new BadRequestException('Unauthorized to delete this file');
      }

      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: file.bucket,
        Key: file.key,
      });

      await this.s3Client.send(deleteCommand);

      // Delete from database
      await this.prisma.file.delete({
        where: { id: fileId },
      });

      this.logger.log(`File deleted successfully: ${file.key}`);
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Get user files with pagination
   */
  async getUserFiles(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ files: UploadedFileInfo[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({
        where: { userId },
      }),
    ]);

    return {
      files,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string, userId?: string): Promise<UploadedFileInfo | null> {
    const where: any = { id: fileId };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.file.findUnique({ where });
  }

  /**
   * Generate public URL for a file
   */
  private generatePublicUrl(key: string, bucket?: string): string {
    const bucketName = bucket || this.bucket;
    
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }

    // Fallback to direct S3 URL
    return `https://${bucketName}.${this.region}.digitaloceanspaces.com/${key}`;
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(
    fileId: string,
    metadata: Record<string, any>,
    userId?: string,
  ): Promise<UploadedFileInfo> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    if (userId && file.userId !== userId) {
      throw new BadRequestException('Unauthorized to update this file');
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data: { metadata },
    });
  }
}