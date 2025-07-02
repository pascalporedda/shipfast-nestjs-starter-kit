import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fileTypeFromBuffer } from 'file-type';

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  requireImageDimensions?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  detectedMimeType?: string;
  detectedExtension?: string;
}

@Injectable()
export class FileValidationService {
  private readonly defaultMaxSize: number;
  private readonly defaultAllowedMimeTypes: string[];
  private readonly defaultAllowedExtensions: string[];

  constructor(private configService: ConfigService) {
    this.defaultMaxSize = this.configService.get<number>('files.maxSize', 10 * 1024 * 1024); // 10MB
    this.defaultAllowedMimeTypes = this.configService.get<string[]>('files.allowedMimeTypes', [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ]);
    this.defaultAllowedExtensions = this.configService.get<string[]>('files.allowedExtensions', [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
      // Archives
      '.zip', '.rar', '.7z',
    ]);
  }

  /**
   * Validate a single file
   */
  async validateFile(
    file: Express.Multer.File,
    options: FileValidationOptions = {},
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    let detectedMimeType: string | undefined;
    let detectedExtension: string | undefined;

    try {
      // Detect actual file type from buffer
      const detectedType = await fileTypeFromBuffer(file.buffer);
      detectedMimeType = detectedType?.mime;
      detectedExtension = detectedType?.ext ? `.${detectedType.ext}` : undefined;

      // Validate file size
      const maxSize = options.maxSize || this.defaultMaxSize;
      if (file.size > maxSize) {
        errors.push(`File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`);
      }

      // Validate empty file
      if (file.size === 0) {
        errors.push('File is empty');
      }

      // Validate MIME type
      const allowedMimeTypes = options.allowedMimeTypes || this.defaultAllowedMimeTypes;
      const actualMimeType = detectedMimeType || file.mimetype;
      
      if (!allowedMimeTypes.includes(actualMimeType)) {
        errors.push(`File type '${actualMimeType}' is not allowed`);
      }

      // Validate file extension
      const allowedExtensions = options.allowedExtensions || this.defaultAllowedExtensions;
      const fileExtension = this.getFileExtension(file.originalname).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`File extension '${fileExtension}' is not allowed`);
      }

      // Check for MIME type spoofing
      if (detectedMimeType && detectedMimeType !== file.mimetype) {
        // Allow some common variations
        const mimeTypeVariations: Record<string, string[]> = {
          'image/jpeg': ['image/jpg'],
          'image/jpg': ['image/jpeg'],
        };

        const allowedVariations = mimeTypeVariations[detectedMimeType] || [];
        if (!allowedVariations.includes(file.mimetype)) {
          errors.push(`File appears to be ${detectedMimeType} but was uploaded as ${file.mimetype}`);
        }
      }

      // Validate filename for security
      this.validateFileName(file.originalname, errors);

      // Additional security checks
      this.performSecurityChecks(file, errors);

    } catch (error) {
      errors.push('Failed to validate file');
    }

    return {
      isValid: errors.length === 0,
      errors,
      detectedMimeType,
      detectedExtension,
    };
  }

  /**
   * Validate multiple files
   */
  async validateFiles(
    files: Express.Multer.File[],
    options: FileValidationOptions = {},
  ): Promise<FileValidationResult[]> {
    const validationPromises = files.map(file => this.validateFile(file, options));
    return Promise.all(validationPromises);
  }

  /**
   * Validate and throw if any file is invalid
   */
  async validateFilesOrThrow(
    files: Express.Multer.File[],
    options: FileValidationOptions = {},
  ): Promise<void> {
    const results = await this.validateFiles(files, options);
    
    const allErrors: string[] = [];
    results.forEach((result, index) => {
      if (!result.isValid) {
        const fileErrors = result.errors.map(error => `File ${index + 1}: ${error}`);
        allErrors.push(...fileErrors);
      }
    });

    if (allErrors.length > 0) {
      throw new BadRequestException(allErrors.join('; '));
    }
  }

  /**
   * Get validation options for specific file types
   */
  getValidationOptionsForType(type: 'avatar' | 'document' | 'image' | 'any'): FileValidationOptions {
    switch (type) {
      case 'avatar':
        return {
          maxSize: 2 * 1024 * 1024, // 2MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
        };
      
      case 'image':
        return {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
          ],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
        };
      
      case 'document':
        return {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
          ],
          allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
        };
      
      default:
        return {};
    }
  }

  /**
   * Validate filename for security issues
   */
  private validateFileName(filename: string, errors: string[]): void {
    // Check for null bytes
    if (filename.includes('\0')) {
      errors.push('Filename contains null bytes');
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      errors.push('Filename contains invalid characters');
    }

    // Check filename length
    if (filename.length > 255) {
      errors.push('Filename is too long');
    }

    // Check for suspicious extensions
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.php', '.asp', '.aspx', '.jsp', '.pl', '.py', '.rb', '.sh',
    ];
    
    const fileExtension = this.getFileExtension(filename).toLowerCase();
    if (suspiciousExtensions.includes(fileExtension)) {
      errors.push('File type is potentially dangerous');
    }
  }

  /**
   * Perform additional security checks
   */
  private performSecurityChecks(file: Express.Multer.File, errors: string[]): void {
    // Check for executable signatures in the beginning of the file
    const buffer = file.buffer;
    
    // Check for PE (Windows executable) signature
    if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
      errors.push('File contains executable signature');
    }

    // Check for ELF (Linux executable) signature
    if (buffer.length >= 4 && 
        buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
      errors.push('File contains executable signature');
    }

    // Check for script signatures
    const fileContent = buffer.toString('utf-8', 0, Math.min(100, buffer.length));
    const scriptPatterns = [
      /^#!\s*\/.*\/bash/,
      /^#!\s*\/.*\/sh/,
      /^#!\s*\/.*\/python/,
      /^#!\s*\/.*\/perl/,
      /<script\s+/i,
      /<\?php/i,
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(fileContent)) {
        errors.push('File contains script content');
        break;
      }
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}