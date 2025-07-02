// File Upload Module Exports
export { FilesModule } from './files.module';
export { FilesController } from './files.controller';
export { FileUploadService, UploadedFileInfo, FileUploadOptions } from './services/file-upload.service';
export { FileValidationService, FileValidationOptions, FileValidationResult } from './services/file-validation.service';

// DTOs
export { FileUploadDto, FileUploadType, SingleFileUploadDto, MultipleFileUploadDto } from './dto/file-upload.dto';
export { 
  FileResponseDto, 
  FileListResponseDto, 
  FileUploadResponseDto, 
  MultipleFileUploadResponseDto 
} from './dto/file-response.dto';
export { FileQueryDto, UpdateFileMetadataDto } from './dto/file-query.dto';

/*
File Upload System Overview
===========================

This module provides a complete file upload system with DigitalOcean Spaces (S3-compatible) storage.

Features:
- Single and multiple file uploads
- File validation (size, type, security)
- Avatar upload integration with users
- File metadata storage in database
- CDN URL generation
- Rate limiting on upload endpoints
- Background job support (via existing queue system)

Quick Start:
1. Set up DigitalOcean Spaces credentials in .env
2. Import FilesModule in your app module (already done)
3. Use the upload endpoints or inject services into your modules

API Endpoints:
- POST /files/upload - Upload single file
- POST /files/upload/multiple - Upload multiple files
- GET /files - Get user files with pagination
- GET /files/:id - Get file by ID
- PATCH /files/:id/metadata - Update file metadata
- DELETE /files/:id - Delete file
- POST /files/avatar - Upload avatar (specialized)
- POST /users/me/avatar - Upload user avatar
- DELETE /users/me/avatar - Remove user avatar

Environment Variables:
Required:
- DO_SPACES_ACCESS_KEY_ID
- DO_SPACES_SECRET_ACCESS_KEY
- DO_SPACES_ENDPOINT
- DO_SPACES_REGION
- DO_SPACES_BUCKET

Optional:
- DO_SPACES_CDN_URL
- FILE_MAX_SIZE (default: 10MB)
- FILE_ALLOWED_MIME_TYPES
- FILE_ALLOWED_EXTENSIONS
- THROTTLE_UPLOAD_TTL (default: 60 seconds)
- THROTTLE_UPLOAD_LIMIT (default: 10 requests)
*/