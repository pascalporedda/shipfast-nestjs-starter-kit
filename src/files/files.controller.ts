import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { FileUploadService } from './services/file-upload.service';
import { FileValidationService } from './services/file-validation.service';
import { FileUploadDto, FileUploadType } from './dto/file-upload.dto';
import { FileResponseDto, FileListResponseDto, FileUploadResponseDto, MultipleFileUploadResponseDto } from './dto/file-response.dto';
import { FileQueryDto, UpdateFileMetadataDto } from './dto/file-query.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly fileValidationService: FileValidationService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1,
    },
  }))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
    @User('id') userId: string,
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file
    const validationOptions = this.fileValidationService.getValidationOptionsForType(
      uploadDto.type || FileUploadType.ANY,
    );
    await this.fileValidationService.validateFilesOrThrow([file], validationOptions);

    // Upload file
    const uploadedFile = await this.fileUploadService.uploadFile(file, {
      userId,
      folder: uploadDto.folder,
      isPublic: uploadDto.isPublic,
      metadata: uploadDto.metadata,
    });

    return {
      success: true,
      message: 'File uploaded successfully',
      file: uploadedFile,
    };
  }

  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10,
    },
  }))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 multiple uploads per minute
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: MultipleFileUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid files or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: FileUploadDto,
    @User('id') userId: string,
  ): Promise<MultipleFileUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed per upload');
    }

    // Validate all files
    const validationOptions = this.fileValidationService.getValidationOptionsForType(
      uploadDto.type || FileUploadType.ANY,
    );
    await this.fileValidationService.validateFilesOrThrow(files, validationOptions);

    // Upload files
    const uploadedFiles = await this.fileUploadService.uploadFiles(files, {
      userId,
      folder: uploadDto.folder,
      isPublic: uploadDto.isPublic,
      metadata: uploadDto.metadata,
    });

    return {
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      uploadedCount: uploadedFiles.length,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user files with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Files per page', example: 20 })
  @ApiQuery({ name: 'mimeType', required: false, description: 'Filter by MIME type' })
  @ApiQuery({ name: 'folder', required: false, description: 'Filter by folder' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in filename' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserFiles(
    @Query() query: FileQueryDto,
    @User('id') userId: string,
  ): Promise<FileListResponseDto> {
    const { files, total, pages } = await this.fileUploadService.getUserFiles(
      userId,
      query.page,
      query.limit,
    );

    return {
      files,
      total,
      pages,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getFileById(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<FileResponseDto> {
    const file = await this.fileUploadService.getFileById(id, userId);
    
    if (!file) {
      throw new BadRequestException('File not found');
    }

    return file;
  }

  @Patch(':id/metadata')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File metadata updated successfully',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateFileMetadata(
    @Param('id') id: string,
    @Body() updateDto: UpdateFileMetadataDto,
    @User('id') userId: string,
  ): Promise<FileResponseDto> {
    const updatedFile = await this.fileUploadService.updateFileMetadata(
      id,
      updateDto.metadata || {},
      userId,
    );

    return updatedFile;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 deletions per minute
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async deleteFile(
    @Param('id') id: string,
    @User('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.fileUploadService.deleteFile(id, userId);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  // Avatar upload endpoint (specialized)
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
      files: 1,
    },
  }))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 avatar uploads per minute
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Avatar uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @User('id') userId: string,
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No avatar file provided');
    }

    // Validate avatar file
    const validationOptions = this.fileValidationService.getValidationOptionsForType(FileUploadType.AVATAR);
    await this.fileValidationService.validateFilesOrThrow([file], validationOptions);

    // Upload avatar
    const uploadedFile = await this.fileUploadService.uploadFile(file, {
      userId,
      folder: 'avatars',
      isPublic: true,
      metadata: { type: 'avatar' },
    });

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      file: uploadedFile,
    };
  }
}