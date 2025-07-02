import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validation decorator for CUID format
 * Validates that the string matches the CUID format used by Prisma
 */
export function IsCuid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCuid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // CUID pattern: starts with 'c' followed by 24 alphanumeric characters
          return /^c[a-z0-9]{24}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid CUID`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for Stripe ID format
 * Validates that the string matches Stripe's ID format
 */
export function IsStripeId(
  type: 'price' | 'product' | 'customer' | 'subscription' | 'payment_method',
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStripeId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [type],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const [idType] = args.constraints;
          
          const patterns = {
            price: /^price_[a-zA-Z0-9]+$/,
            product: /^prod_[a-zA-Z0-9]+$/,
            customer: /^cus_[a-zA-Z0-9]+$/,
            subscription: /^sub_[a-zA-Z0-9]+$/,
            payment_method: /^pm_[a-zA-Z0-9]+$/,
          };
          
          return patterns[idType]?.test(value) || false;
        },
        defaultMessage(args: ValidationArguments) {
          const [idType] = args.constraints;
          return `${args.property} must be a valid Stripe ${idType} ID`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for URL with specific domains
 */
export function IsUrlWithDomain(
  allowedDomains?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUrlWithDomain',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [allowedDomains],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          try {
            const url = new URL(value);
            const [domains] = args.constraints;
            
            // If no specific domains are specified, just validate it's a valid URL
            if (!domains || domains.length === 0) {
              return true;
            }
            
            // Check if the domain is in the allowed list
            return domains.some((domain: string) => 
              url.hostname === domain || url.hostname.endsWith(`.${domain}`)
            );
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [domains] = args.constraints;
          if (domains && domains.length > 0) {
            return `${args.property} must be a valid URL from allowed domains: ${domains.join(', ')}`;
          }
          return `${args.property} must be a valid URL`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for subscription status
 */
export function IsSubscriptionStatus(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSubscriptionStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const validStatuses = [
            'INCOMPLETE',
            'INCOMPLETE_EXPIRED',
            'TRIALING',
            'ACTIVE',
            'PAST_DUE',
            'CANCELED',
            'UNPAID',
            'PAUSED',
          ];
          return validStatuses.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid subscription status`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for metadata objects
 */
export function IsMetadata(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMetadata',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) return true;
          if (typeof value !== 'object') return false;
          
          // Check that all keys and values are strings
          return Object.entries(value).every(
            ([key, val]) => typeof key === 'string' && typeof val === 'string'
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an object with string keys and values`;
        },
      },
    });
  };
}