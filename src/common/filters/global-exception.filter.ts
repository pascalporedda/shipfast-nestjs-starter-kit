import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { BaseCustomException } from '../exceptions/custom.exceptions';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  errorCode?: string;
  context?: Record<string, any>;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: any[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorResponse } = this.getErrorResponse(exception, request);
    
    // Add user context to Sentry if available
    const user = (request as any).user;
    if (user) {
      Sentry.setUser({
        id: user.id?.toString(),
        email: user.email,
        username: user.name,
      });
    }

    // Add request context to Sentry
    Sentry.setTag('path', request.url);
    Sentry.setTag('method', request.method);
    Sentry.setTag('statusCode', status.toString());
    
    // Add custom context
    Sentry.setContext('request', {
      url: request.url,
      method: request.method,
      headers: this.sanitizeHeaders(request.headers),
      query: request.query,
      body: this.sanitizeBody(request.body),
      userAgent: request.get('user-agent'),
      ip: request.ip,
    });

    // Determine if we should capture this exception in Sentry
    if (this.shouldCaptureInSentry(exception, status)) {
      if (exception instanceof BaseCustomException) {
        // For custom exceptions, add additional context
        Sentry.setContext('customError', {
          errorCode: exception.getErrorCode(),
          context: exception.getContext(),
        });
        
        // Capture as message for business logic errors (less severity)
        Sentry.captureMessage(
          `${exception.getErrorCode()}: ${exception.message}`,
          'warning',
        );
      } else {
        // Capture as exception for system errors (higher severity)
        Sentry.captureException(exception);
      }
    }

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(status).json(errorResponse);
  }

  private getErrorResponse(exception: unknown, request: Request): {
    status: number;
    errorResponse: ErrorResponse;
  } {
    let status: number;
    let message: string;
    let error: string;
    let errorCode: string | undefined;
    let context: Record<string, any> | undefined;
    let details: any[] | undefined;

    if (exception instanceof BaseCustomException) {
      // Handle custom business logic exceptions
      status = exception.getStatus();
      message = exception.message;
      error = exception.constructor.name;
      errorCode = exception.getErrorCode();
      context = exception.getContext();
    } else if (exception instanceof HttpException) {
      // Handle standard HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || 'Http Exception';
        details = responseObj.details;
      } else {
        message = exceptionResponse as string;
        error = 'Http Exception';
      }
    } else if (exception instanceof Error) {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.isProduction() 
        ? 'Internal server error' 
        : exception.message;
      error = 'Internal Server Error';
      errorCode = 'INTERNAL_SERVER_ERROR';
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
      errorCode = 'UNKNOWN_ERROR';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: this.getRequestId(request),
    };

    // Add optional fields only if they exist
    if (errorCode) errorResponse.errorCode = errorCode;
    if (context && Object.keys(context).length > 0) {
      errorResponse.context = this.isProduction() 
        ? this.sanitizeContext(context) 
        : context;
    }
    if (details) errorResponse.details = details;

    return { status, errorResponse };
  }

  private shouldCaptureInSentry(exception: unknown, status: number): boolean {
    // Don't capture 4xx errors except for specific cases
    if (status >= 400 && status < 500) {
      // Capture authentication/authorization errors
      if (status === 401 || status === 403) return true;
      
      // Capture custom business logic errors for monitoring
      if (exception instanceof BaseCustomException) return true;
      
      // Don't capture validation errors and other client errors
      return false;
    }
    
    // Always capture 5xx errors
    return status >= 500;
  }

  private logError(
    exception: unknown, 
    request: Request, 
    errorResponse: ErrorResponse
  ): void {
    const { statusCode, message, errorCode } = errorResponse;
    const logContext = {
      statusCode,
      errorCode,
      method: request.method,
      url: request.url,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      requestId: this.getRequestId(request),
    };

    if (statusCode >= 500) {
      // Log 5xx errors as errors with stack trace
      this.logger.error(
        `${message} - ${JSON.stringify(logContext)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (statusCode >= 400) {
      // Log 4xx errors as warnings (less verbose)
      this.logger.warn(`${message} - ${JSON.stringify(logContext)}`);
    }
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'token',
      'secret',
      'creditCard',
      'ssn',
    ];
    
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          (result as any)[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          (result as any)[key] = sanitizeObject(value);
        } else {
          (result as any)[key] = value;
        }
      }
      
      return result;
    };
    
    return sanitizeObject(sanitized);
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    // Remove sensitive information from context in production
    const sanitized = { ...context };
    delete sanitized.password;
    delete sanitized.secret;
    delete sanitized.token;
    return sanitized;
  }

  private getRequestId(request: Request): string | undefined {
    // Try to get request ID from various sources
    return (
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      (request as any).id
    );
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}