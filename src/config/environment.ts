// Environment configuration for different deployment stages

export interface Environment {
  name: string;
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    analytics: boolean;
    errorReporting: boolean;
    debug: boolean;
  };
}

const development: Environment = {
  name: 'development',
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  features: {
    analytics: false,
    errorReporting: false,
    debug: true,
  },
};

const staging: Environment = {
  name: 'staging',
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  features: {
    analytics: true,
    errorReporting: true,
    debug: true,
  },
};

const production: Environment = {
  name: 'production',
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  features: {
    analytics: true,
    errorReporting: true,
    debug: false,
  },
};

// Determine current environment
const getEnvironment = (): Environment => {
  const env = import.meta.env.VITE_ENVIRONMENT || import.meta.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'staging':
      return staging;
    case 'production':
      return production;
    default:
      return development;
  }
};

export const environment = getEnvironment();

// Validation helper
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!environment.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!environment.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  // Validate URL format
  if (environment.supabase.url && !environment.supabase.url.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }

  // Validate anon key format (basic check)
  if (environment.supabase.anonKey && !environment.supabase.anonKey.startsWith('eyJ')) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (JWT tokens start with "eyJ")');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Logging helper that respects debug setting
export const log = {
  debug: (...args: any[]) => {
    if (environment.features.debug) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    if (environment.features.errorReporting) {
      // Here you could integrate with error reporting services like Sentry
      // Example: Sentry.captureException(args[0]);
    }
  },
};

export default environment;