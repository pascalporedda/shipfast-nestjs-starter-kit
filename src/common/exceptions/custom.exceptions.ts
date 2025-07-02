import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base custom exception class that all business logic exceptions should extend
 */
export abstract class BaseCustomException extends HttpException {
  public readonly errorCode: string;
  public readonly context: Record<string, any>;

  constructor(
    message: string,
    status: HttpStatus,
    errorCode: string,
    context: Record<string, any> = {},
  ) {
    super(message, status);
    this.errorCode = errorCode;
    this.context = context;
  }

  public getErrorCode(): string {
    return this.errorCode;
  }

  public getContext(): Record<string, any> {
    return this.context;
  }
}

/**
 * Business logic error - when business rules are violated
 */
export class BusinessLogicException extends BaseCustomException {
  constructor(
    message: string,
    errorCode: string = 'BUSINESS_LOGIC_ERROR',
    context: Record<string, any> = {},
  ) {
    super(message, HttpStatus.BAD_REQUEST, errorCode, context);
  }
}

/**
 * Resource not found error
 */
export class ResourceNotFoundException extends BaseCustomException {
  constructor(
    resource: string,
    identifier: string | number,
    context: Record<string, any> = {},
  ) {
    const message = `${resource} with identifier '${identifier}' was not found`;
    super(message, HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND', {
      resource,
      identifier,
      ...context,
    });
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsException extends BaseCustomException {
  constructor(
    action: string,
    resource: string,
    context: Record<string, any> = {},
  ) {
    const message = `Insufficient permissions to ${action} ${resource}`;
    super(message, HttpStatus.FORBIDDEN, 'INSUFFICIENT_PERMISSIONS', {
      action,
      resource,
      ...context,
    });
  }
}

/**
 * Resource already exists error
 */
export class ResourceAlreadyExistsException extends BaseCustomException {
  constructor(
    resource: string,
    identifier: string | number,
    context: Record<string, any> = {},
  ) {
    const message = `${resource} with identifier '${identifier}' already exists`;
    super(message, HttpStatus.CONFLICT, 'RESOURCE_ALREADY_EXISTS', {
      resource,
      identifier,
      ...context,
    });
  }
}

/**
 * External service error
 */
export class ExternalServiceException extends BaseCustomException {
  constructor(
    service: string,
    operation: string,
    originalError?: Error,
    context: Record<string, any> = {},
  ) {
    const message = `External service '${service}' failed during '${operation}'`;
    super(message, HttpStatus.BAD_GATEWAY, 'EXTERNAL_SERVICE_ERROR', {
      service,
      operation,
      originalError: originalError?.message,
      ...context,
    });
  }
}

/**
 * Payment processing error
 */
export class PaymentProcessingException extends BaseCustomException {
  constructor(
    message: string,
    paymentProvider: string,
    context: Record<string, any> = {},
  ) {
    super(message, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_PROCESSING_ERROR', {
      paymentProvider,
      ...context,
    });
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededException extends BaseCustomException {
  constructor(
    action: string,
    limit: number,
    resetTime: Date,
    context: Record<string, any> = {},
  ) {
    const message = `Rate limit exceeded for action '${action}'. Limit: ${limit} requests. Try again after ${resetTime.toISOString()}`;
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', {
      action,
      limit,
      resetTime: resetTime.toISOString(),
      ...context,
    });
  }
}

/**
 * Invalid operation error
 */
export class InvalidOperationException extends BaseCustomException {
  constructor(
    operation: string,
    reason: string,
    context: Record<string, any> = {},
  ) {
    const message = `Invalid operation '${operation}': ${reason}`;
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_OPERATION', {
      operation,
      reason,
      ...context,
    });
  }
}

/**
 * Configuration error
 */
export class ConfigurationException extends BaseCustomException {
  constructor(
    configKey: string,
    reason: string,
    context: Record<string, any> = {},
  ) {
    const message = `Configuration error for '${configKey}': ${reason}`;
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'CONFIGURATION_ERROR', {
      configKey,
      reason,
      ...context,
    });
  }
}

/**
 * Data validation error (different from input validation)
 */
export class DataValidationException extends BaseCustomException {
  constructor(
    field: string,
    value: any,
    constraint: string,
    context: Record<string, any> = {},
  ) {
    const message = `Data validation failed for field '${field}' with value '${value}': ${constraint}`;
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'DATA_VALIDATION_ERROR', {
      field,
      value,
      constraint,
      ...context,
    });
  }
}