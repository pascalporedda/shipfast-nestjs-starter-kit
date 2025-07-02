import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  debug: boolean;
}

export function initializeSentry(configService: ConfigService): void {
  const sentryDsn = configService.get<string>('SENTRY_DSN');
  
  if (!sentryDsn) {
    console.warn('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  const environment = configService.get<string>('NODE_ENV', 'development');
  const release = configService.get<string>('APP_VERSION');
  const debug = environment === 'development';
  
  // Sample rates based on environment
  const tracesSampleRate = environment === 'production' ? 0.1 : 1.0;
  const profilesSampleRate = environment === 'production' ? 0.1 : 1.0;

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release,
    debug,
    tracesSampleRate,
    profilesSampleRate,
    
    // Performance monitoring integrations
    integrations: [
      // Enable HTTP instrumentation
      Sentry.httpIntegration(),
      // Enable Express instrumentation
      Sentry.expressIntegration(),
      // Enable console instrumentation
      Sentry.consoleIntegration(),
      // Enable module loading instrumentation
      Sentry.modulesIntegration(),
    ],

    // Transaction naming
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.data) {
        event.request.data = filterSensitiveData(event.request.data);
      }
      
      // Don't send events in test environment
      if (environment === 'test') {
        return null;
      }

      return event;
    },

    beforeSendTransaction(event) {
      // Don't send transactions in test environment
      if (environment === 'test') {
        return null;
      }

      return event;
    },

    // Error filtering
    ignoreErrors: [
      // Browser errors that don't affect backend
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      
      // Common bot/scanner errors
      'Request aborted',
      'Request timeout',
      
      // Validation errors (handled by validation filter)
      'ValidationError',
      
      // Expected business logic errors
      'UnauthorizedError',
      'ForbiddenError',
    ],

    // Transaction filtering
    tracesSampler: (samplingContext) => {
      // Sample health checks at lower rate
      if (samplingContext.request?.url?.includes('/health')) {
        return 0.01;
      }
      
      // Sample static assets at lower rate
      if (samplingContext.request?.url?.match(/\.(js|css|png|jpg|gif|ico|svg)$/)) {
        return 0.01;
      }
      
      return tracesSampleRate;
    },
  });

  console.log(`✅ Sentry initialized for ${environment} environment`);
}

function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'authorization',
    'cookie',
  ];

  const filtered = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const isSensitive = sensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      (filtered as any)[key] = '[FILTERED]';
    } else if (typeof value === 'object' && value !== null) {
      (filtered as any)[key] = filterSensitiveData(value);
    } else {
      (filtered as any)[key] = value;
    }
  }

  return filtered;
}

// Utility function to add user context to Sentry
export function setSentryUser(user: {
  id?: string | number;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser({
    id: user.id?.toString(),
    email: user.email,
    username: user.username,
  });
}

// Utility function to add custom context to Sentry
export function setSentryContext(key: string, context: Record<string, any>): void {
  Sentry.setContext(key, context);
}

// Utility function to add tags to Sentry
export function setSentryTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}