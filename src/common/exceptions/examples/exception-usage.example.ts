import {
  BusinessLogicException,
  ResourceNotFoundException,
  InsufficientPermissionsException,
  ResourceAlreadyExistsException,
  ExternalServiceException,
  PaymentProcessingException,
  InvalidOperationException,
  ConfigurationException,
  DataValidationException,
} from '../custom.exceptions';

/**
 * Example service demonstrating how to use custom exceptions
 * This file is for reference only and should not be used in production
 */
export class ExceptionUsageExamples {
  
  // Example: User tries to delete an account that doesn't exist
  deleteUserExample(userId: string) {
    const user = null; // Simulating user not found
    
    if (!user) {
      throw new ResourceNotFoundException('User', userId, {
        operation: 'delete',
        requestedBy: 'current-user-id',
      });
    }
  }

  // Example: User tries to access admin functionality
  adminAccessExample(currentUser: any) {
    if (currentUser.role !== 'admin') {
      throw new InsufficientPermissionsException(
        'access',
        'admin panel',
        {
          userRole: currentUser.role,
          requiredRole: 'admin',
          userId: currentUser.id,
        }
      );
    }
  }

  // Example: User tries to register with existing email
  registerUserExample(email: string) {
    const existingUser = true; // Simulating user exists
    
    if (existingUser) {
      throw new ResourceAlreadyExistsException('User', email, {
        field: 'email',
        suggestion: 'Try logging in instead',
      });
    }
  }

  // Example: Business logic violation - insufficient credits
  processPaymentExample(userId: string, amount: number) {
    const userCredits = 50; // Simulating user credits
    
    if (userCredits < amount) {
      throw new BusinessLogicException(
        `Insufficient credits. Required: ${amount}, Available: ${userCredits}`,
        'INSUFFICIENT_CREDITS',
        {
          userId,
          requiredAmount: amount,
          availableCredits: userCredits,
          shortfall: amount - userCredits,
        }
      );
    }
  }

  // Example: External service failure
  sendEmailExample(recipientEmail: string) {
    try {
      // Simulating email service call that fails
      throw new Error('SMTP connection failed');
    } catch (error) {
      throw new ExternalServiceException(
        'Email Service',
        'send email',
        error as Error,
        {
          recipient: recipientEmail,
          provider: 'resend',
          retryable: true,
        }
      );
    }
  }

  // Example: Payment processing error
  stripePaymentExample(amount: number, currency: string) {
    try {
      // Simulating Stripe API call that fails
      throw new Error('Your card was declined');
    } catch (error) {
      throw new PaymentProcessingException(
        'Payment failed: Your card was declined',
        'stripe',
        {
          amount,
          currency,
          errorCode: 'card_declined',
          retryable: false,
        }
      );
    }
  }

  // Example: Invalid operation
  cancelSubscriptionExample(subscriptionId: string) {
    const subscription = { status: 'cancelled' }; // Simulating already cancelled
    
    if (subscription.status === 'cancelled') {
      throw new InvalidOperationException(
        'cancel subscription',
        'Subscription is already cancelled',
        {
          subscriptionId,
          currentStatus: subscription.status,
          validStatuses: ['active', 'past_due'],
        }
      );
    }
  }

  // Example: Configuration error
  databaseConnectionExample() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new ConfigurationException(
        'DATABASE_URL',
        'Environment variable is not set',
        {
          required: true,
          example: 'postgresql://user:pass@localhost:5432/db',
        }
      );
    }
  }

  // Example: Data validation error
  validateAgeExample(age: number) {
    if (age < 18) {
      throw new DataValidationException(
        'age',
        age,
        'User must be at least 18 years old',
        {
          minimumAge: 18,
          providedAge: age,
          validationRule: 'minimum_age',
        }
      );
    }
  }
}