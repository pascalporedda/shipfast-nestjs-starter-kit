import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

interface ValidationErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details: ValidationErrorDetail[];
  timestamp: string;
  path: string;
}

interface ValidationErrorDetail {
  field: string;
  value: any;
  constraints: Record<string, string>;
  children?: ValidationErrorDetail[];
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const exceptionResponse = exception.getResponse();

    // Only handle validation errors, let other BadRequestExceptions pass through
    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray((exceptionResponse as any).message)
    ) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest();
      
      const status = exception.getStatus();
      const validationErrors = (exceptionResponse as any).message;
      
      // Transform class-validator errors into a more user-friendly format
      const details = this.transformValidationErrors(validationErrors);
      
      const errorResponse: ValidationErrorResponse = {
        statusCode: status,
        message: 'Validation failed',
        error: 'Bad Request',
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      response.status(status).json(errorResponse);
    } else {
      // Let other BadRequestExceptions be handled by GlobalExceptionFilter
      throw exception;
    }
  }

  private transformValidationErrors(errors: any[]): ValidationErrorDetail[] {
    return errors.map((error) => {
      if (typeof error === 'string') {
        // Simple string error
        return {
          field: 'unknown',
          value: undefined,
          constraints: { error: error },
        };
      }

      if (error.constraints) {
        // class-validator ValidationError
        const detail: ValidationErrorDetail = {
          field: error.property,
          value: error.value,
          constraints: error.constraints,
        };

        if (error.children && error.children.length > 0) {
          detail.children = this.transformValidationErrors(error.children);
        }

        return detail;
      }

      // Fallback for unknown error format
      return {
        field: 'unknown',
        value: error.value || undefined,
        constraints: { error: error.toString() },
      };
    });
  }
}