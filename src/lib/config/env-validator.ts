import { z } from 'zod';

// Define the environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().regex(/^sk-/, 'OPENAI_API_KEY must start with sk-'),
  
  // Pinecone
  PINECONE_API_KEY: z.string().min(1, 'PINECONE_API_KEY is required'),
  PINECONE_ENVIRONMENT: z.string().default('production'),
  PINECONE_INDEX_NAME: z.string().default('jarvis-vectors'),
  
  // Redis (optional)
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().regex(/^sk_/, 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().regex(/^pk_/, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'),
  
  // GitHub (optional)
  GITHUB_TOKEN: z.string().optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
});

type EnvConfig = z.infer<typeof envSchema>;

export class EnvValidator {
  private static instance: EnvValidator;
  private config: EnvConfig | null = null;
  private errors: string[] = [];

  private constructor() {}

  static getInstance(): EnvValidator {
    if (!this.instance) {
      this.instance = new EnvValidator();
    }
    return this.instance;
  }

  /**
   * Validates environment variables and returns the validated config
   * @throws Error if validation fails
   */
  validate(): EnvConfig {
    if (this.config) {
      return this.config;
    }

    try {
      // Parse and validate environment variables
      this.config = envSchema.parse(process.env);
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        
        const errorMessage = `Environment validation failed:\n${this.errors.join('\n')}`;
        
        // In production, throw error to prevent app from starting
        if (process.env.NODE_ENV === 'production') {
          throw new Error(errorMessage);
        }
        
        // In development/test, log warning but continue
        console.warn('⚠️ Environment Validation Warnings:');
        console.warn(this.errors.join('\n'));
        
        // Return partial config with defaults
        return this.getPartialConfig();
      }
      throw error;
    }
  }

  /**
   * Gets a partial config with defaults for missing values
   * Used in development/test environments
   */
  private getPartialConfig(): EnvConfig {
    return {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/jarvis',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-key-minimum-32-characters-long',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-placeholder',
      PINECONE_API_KEY: process.env.PINECONE_API_KEY || 'placeholder-key',
      PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'production',
      PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'jarvis-vectors',
      REDIS_URL: process.env.REDIS_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
      PORT: process.env.PORT || '3000',
    };
  }

  /**
   * Gets the validated config or throws if not validated
   */
  getConfig(): EnvConfig {
    if (!this.config) {
      return this.validate();
    }
    return this.config;
  }

  /**
   * Gets validation errors if any
   */
  getErrors(): string[] {
    return this.errors;
  }

  /**
   * Checks if environment is valid (no errors)
   */
  isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Resets the validator (useful for testing)
   */
  reset(): void {
    this.config = null;
    this.errors = [];
  }
}

// Export singleton instance
export const envValidator = EnvValidator.getInstance();

// Export validated config
export const env = envValidator.getConfig();