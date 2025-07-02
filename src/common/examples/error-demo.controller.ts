import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BusinessLogicException,
  ResourceNotFoundException,
  InsufficientPermissionsException,
  ExternalServiceException,
  PaymentProcessingException,
} from '../exceptions/custom.exceptions';

/**
 * Demo controller to showcase error handling capabilities
 * This is for demonstration purposes only
 */
@ApiTags('Error Demo')
@Controller('demo/errors')
export class ErrorDemoController {

  @Get('not-found/:id')
  @ApiOperation({ summary: 'Demonstrate ResourceNotFoundException' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  demoNotFound(@Param('id') id: string) {
    // Simulate resource not found
    throw new ResourceNotFoundException('User', id, {
      searchedIn: 'database',
      timestamp: new Date().toISOString(),
    });
  }

  @Get('business-logic-error')
  @ApiOperation({ summary: 'Demonstrate BusinessLogicException' })
  @ApiResponse({ status: 400, description: 'Business logic violation' })
  demoBusinessLogic() {
    // Simulate business logic error
    throw new BusinessLogicException(
      'Cannot delete user with active subscription',
      'USER_HAS_ACTIVE_SUBSCRIPTION',
      {
        userId: 'user_123',
        subscriptionStatus: 'active',
        subscriptionId: 'sub_456',
      }
    );
  }

  @Get('insufficient-permissions')
  @ApiOperation({ summary: 'Demonstrate InsufficientPermissionsException' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  demoInsufficientPermissions() {
    // Simulate insufficient permissions
    throw new InsufficientPermissionsException(
      'delete',
      'admin resources',
      {
        userRole: 'user',
        requiredRole: 'admin',
        resource: 'admin-panel',
      }
    );
  }

  @Get('external-service-error')
  @ApiOperation({ summary: 'Demonstrate ExternalServiceException' })
  @ApiResponse({ status: 502, description: 'External service error' })
  demoExternalServiceError() {
    // Simulate external service error
    const originalError = new Error('Connection timeout');
    throw new ExternalServiceException(
      'Email Service',
      'send welcome email',
      originalError,
      {
        provider: 'resend',
        recipient: 'user@example.com',
        retryAttempt: 3,
        maxRetries: 3,
      }
    );
  }

  @Post('payment-error')
  @ApiOperation({ summary: 'Demonstrate PaymentProcessingException' })
  @ApiResponse({ status: 402, description: 'Payment processing error' })
  demoPaymentError(@Body() body: { amount: number; currency: string }) {
    // Simulate payment processing error
    throw new PaymentProcessingException(
      'Your card was declined due to insufficient funds',
      'stripe',
      {
        amount: body.amount,
        currency: body.currency,
        errorCode: 'card_declined',
        declineCode: 'insufficient_funds',
        paymentMethodId: 'pm_test_123',
      }
    );
  }

  @Get('unexpected-error')
  @ApiOperation({ summary: 'Demonstrate unexpected error handling' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  demoUnexpectedError() {
    // Simulate unexpected error
    throw new Error('This is an unexpected error that should be captured by Sentry');
  }

  @Get('success')
  @ApiOperation({ summary: 'Demonstrate successful response' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  demoSuccess() {
    return {
      message: 'This endpoint works correctly',
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7),
    };
  }
}