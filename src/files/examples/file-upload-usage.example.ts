/**
 * File Upload Usage Examples
 * 
 * This file shows examples of how to use the file upload system in your application.
 * These are for documentation purposes and should not be imported directly.
 */

import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { FileUploadService } from '../services/file-upload.service';
import { FileValidationService } from '../services/file-validation.service';
import { FileUploadType } from '../dto/file-upload.dto';

// Example 1: Basic File Upload
@Controller('examples')
export class ExampleController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly fileValidationService: FileValidationService,
  ) {}

  // Example: Upload user document
  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @User('id') userId: string,
  ) {
    // Validate document file
    const validationOptions = this.fileValidationService.getValidationOptionsForType(FileUploadType.DOCUMENT);
    await this.fileValidationService.validateFilesOrThrow([file], validationOptions);

    // Upload with specific folder and metadata
    const uploadedFile = await this.fileUploadService.uploadFile(file, {
      userId,
      folder: 'documents',
      isPublic: false, // Private document
      metadata: {
        category: 'user-documents',
        uploadedAt: new Date().toISOString(),
      },
    });

    return { success: true, file: uploadedFile };
  }

  // Example: Upload multiple images
  @Post('gallery')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images
  async uploadGalleryImages(
    @UploadedFiles() files: Express.Multer.File[],
    @User('id') userId: string,
  ) {
    // Validate image files
    const validationOptions = this.fileValidationService.getValidationOptionsForType(FileUploadType.IMAGE);
    await this.fileValidationService.validateFilesOrThrow(files, validationOptions);

    // Upload all images
    const uploadedFiles = await this.fileUploadService.uploadFiles(files, {
      userId,
      folder: 'gallery',
      isPublic: true,
      metadata: {
        category: 'gallery',
        album: 'user-uploads',
      },
    });

    return { success: true, files: uploadedFiles, count: uploadedFiles.length };
  }
}

// Example 2: Service Usage in Business Logic
export class UserProfileService {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly fileValidationService: FileValidationService,
  ) {}

  async updateUserAvatar(userId: string, avatarFile: Express.Multer.File) {
    // Custom validation for avatar
    const validationResult = await this.fileValidationService.validateFile(avatarFile, {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    });

    if (!validationResult.isValid) {
      throw new Error(`Avatar validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Upload avatar
    const uploadedAvatar = await this.fileUploadService.uploadFile(avatarFile, {
      userId,
      folder: 'avatars',
      isPublic: true,
      metadata: {
        type: 'avatar',
        dimensions: 'auto-detected', // You could add image processing here
      },
    });

    return uploadedAvatar;
  }

  async getUserFiles(userId: string, page = 1, limit = 20) {
    return this.fileUploadService.getUserFiles(userId, page, limit);
  }

  async deleteUserFile(userId: string, fileId: string) {
    await this.fileUploadService.deleteFile(fileId, userId);
  }
}

// Example 3: Custom File Processing
export class DocumentProcessingService {
  constructor(private readonly fileUploadService: FileUploadService) {}

  async uploadAndProcessDocument(
    file: Express.Multer.File,
    userId: string,
    processingOptions: { extractText?: boolean; generateThumbnail?: boolean },
  ) {
    // Upload the original file first
    const uploadedFile = await this.fileUploadService.uploadFile(file, {
      userId,
      folder: 'documents/originals',
      isPublic: false,
      metadata: {
        originalFile: true,
        processing: 'pending',
        ...processingOptions,
      },
    });

    // In a real implementation, you might:
    // 1. Queue background jobs for processing
    // 2. Extract text using OCR
    // 3. Generate thumbnails
    // 4. Update file metadata with processing results

    return {
      file: uploadedFile,
      processingStatus: 'queued',
      estimatedProcessingTime: '2-5 minutes',
    };
  }
}

// Example 4: Validation Examples
export class FileValidationExamples {
  constructor(private readonly validationService: FileValidationService) {}

  // Custom validation for profile pictures
  async validateProfilePicture(file: Express.Multer.File) {
    return this.validationService.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    });
  }

  // Strict validation for legal documents
  async validateLegalDocument(file: Express.Multer.File) {
    return this.validationService.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf'],
      allowedExtensions: ['.pdf'],
    });
  }

  // Batch validation
  async validateMultipleFiles(files: Express.Multer.File[]) {
    const results = await this.validationService.validateFiles(files, {
      maxSize: 2 * 1024 * 1024, // 2MB each
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
    });

    return {
      allValid: results.every(r => r.isValid),
      results,
      summary: {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
      },
    };
  }
}

/*
API Usage Examples:

1. Upload single file:
POST /files/upload
Content-Type: multipart/form-data
Body: file (form field)
Query params: ?type=avatar&folder=avatars&isPublic=true

2. Upload multiple files:
POST /files/upload/multiple
Content-Type: multipart/form-data
Body: files[] (form field with multiple files)

3. Upload avatar (specialized endpoint):
POST /files/avatar
Content-Type: multipart/form-data
Body: avatar (form field)

4. Upload user avatar via users endpoint:
POST /users/me/avatar
Content-Type: multipart/form-data
Body: avatar (form field)

5. Get user files:
GET /files?page=1&limit=20&mimeType=image/jpeg&folder=avatars

6. Delete file:
DELETE /files/:fileId

7. Update file metadata:
PATCH /files/:fileId/metadata
Body: { "metadata": { "description": "Updated description" } }

Environment Variables Required:
- DO_SPACES_ACCESS_KEY_ID
- DO_SPACES_SECRET_ACCESS_KEY
- DO_SPACES_ENDPOINT
- DO_SPACES_REGION
- DO_SPACES_BUCKET
- DO_SPACES_CDN_URL (optional)
- FILE_MAX_SIZE (optional, defaults to 10MB)
- FILE_ALLOWED_MIME_TYPES (optional, comma-separated)
- FILE_ALLOWED_EXTENSIONS (optional, comma-separated)
*/