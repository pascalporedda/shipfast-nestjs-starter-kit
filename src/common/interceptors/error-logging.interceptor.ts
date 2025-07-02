import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    
    // Generate or extract request ID
    const requestId = this.getOrCreateRequestId(request);
    
    // Set request ID in response headers for tracing
    response.setHeader('X-Request-ID', requestId);
    
    // Set Sentry transaction and tags
    Sentry.setTag('requestId', requestId);
    Sentry.setTag('method', request.method);
    Sentry.setTag('path', request.route?.path || request.url);

    // Log incoming request
    this.logRequest(request, requestId);

    return next.handle().pipe(
      tap((data) => {
        // Log successful response
        const duration = Date.now() - startTime;
        this.logResponse(request, response, duration, requestId, true);
      }),
      catchError((error) => {
        // Log error response
        const duration = Date.now() - startTime;
        this.logResponse(request, response, duration, requestId, false, error);
        
        // Re-throw the error so it can be handled by the exception filter
        return throwError(() => error);
      })
    );
  }

  private getOrCreateRequestId(request: Request): string {
    // Try to get existing request ID from headers
    let requestId = 
      request.headers['x-request-id'] as string ||
      request.headers['x-correlation-id'] as string;
    
    if (!requestId) {
      // Generate a new request ID
      requestId = this.generateRequestId();
      // Store it in the request for later use
      (request as any).id = requestId;
    }
    
    return requestId;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private logRequest(request: Request, requestId: string): void {
    const { method, url, headers, query, body } = request;
    
    const logData = {
      requestId,
      method,
      url,
      userAgent: headers['user-agent'],
      ip: request.ip,
      query: Object.keys(query).length > 0 ? query : undefined,
      bodySize: body ? JSON.stringify(body).length : 0,
      contentType: headers['content-type'],
    };

    this.logger.log(`Incoming ${method} ${url}`, JSON.stringify(logData));
  }

  private logResponse(
    request: Request,
    response: Response,
    duration: number,
    requestId: string,
    success: boolean,
    error?: any
  ): void {
    const { method, url } = request;
    const { statusCode } = response;
    
    const logData = {
      requestId,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      success,
      contentLength: response.get('content-length'),
    };

    if (success) {
      if (statusCode >= 400) {
        this.logger.warn(
          `Completed ${method} ${url} with client error`,
          JSON.stringify(logData)
        );
      } else {
        this.logger.log(
          `Completed ${method} ${url}`,
          JSON.stringify(logData)
        );
      }
    } else {
      const errorData = {
        ...logData,
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
      };
      
      if (statusCode >= 500 || !statusCode) {
        this.logger.error(
          `Failed ${method} ${url} with server error`,
          JSON.stringify(errorData)
        );
      } else {
        this.logger.warn(
          `Failed ${method} ${url} with client error`,
          JSON.stringify(errorData)
        );
      }
    }

    // Add performance monitoring
    if (duration > 5000) { // Log slow requests (>5s)
      this.logger.warn(
        `Slow request detected: ${method} ${url} took ${duration}ms`,
        JSON.stringify({ requestId, duration, url: request.url })
      );
      
      // Send slow request event to Sentry
      Sentry.addBreadcrumb({
        message: 'Slow request detected',
        level: 'warning',
        data: {
          url: request.url,
          method: request.method,
          duration,
          requestId,
        },
      });
    }
  }
}