import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Strict rate limiting for authentication endpoints
 * Allows only 10 requests per 5 minutes (300 seconds)
 */
export const AuthThrottle = () => 
  applyDecorators(
    Throttle({ 
      auth: {
        limit: 10,
        ttl: 300000, // 5 minutes in milliseconds
      }
    })
  );

/**
 * Moderate rate limiting for payment endpoints
 * Allows 20 requests per minute
 */
export const PaymentThrottle = () => 
  applyDecorators(
    Throttle({ 
      payment: {
        limit: 20,
        ttl: 60000, // 1 minute in milliseconds
      }
    })
  );

/**
 * Lenient rate limiting for user profile endpoints
 * Allows 50 requests per minute
 */
export const UserProfileThrottle = () => 
  applyDecorators(
    Throttle({ 
      userProfile: {
        limit: 50,
        ttl: 60000, // 1 minute in milliseconds
      }
    })
  );

/**
 * Very strict rate limiting for file upload endpoints
 * Allows only 5 requests per minute
 */
export const FileUploadThrottle = () => 
  applyDecorators(
    Throttle({ 
      fileUpload: {
        limit: 5,
        ttl: 60000, // 1 minute in milliseconds
      }
    })
  );

/**
 * Custom throttle decorator that allows specifying custom limits
 * @param limit - Number of requests allowed
 * @param ttl - Time window in seconds
 */
export const CustomThrottle = (limit: number, ttl: number) => 
  applyDecorators(
    Throttle({ 
      custom: {
        limit,
        ttl: ttl * 1000, // Convert seconds to milliseconds
      }
    })
  );