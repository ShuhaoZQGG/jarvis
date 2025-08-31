import { EnvValidator } from './env-validator';

describe('EnvValidator', () => {
  let validator: EnvValidator;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    // Get fresh instance
    validator = EnvValidator.getInstance();
    validator.reset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validation', () => {
    it('should validate valid environment variables', () => {
      process.env = {
        ...process.env,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        OPENAI_API_KEY: 'sk-test123',
        PINECONE_API_KEY: 'pinecone-key',
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        NODE_ENV: 'test',
      };

      const config = validator.validate();
      expect(config).toBeDefined();
      expect(validator.isValid()).toBe(true);
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('should return partial config in development with warnings', () => {
      process.env = {
        NODE_ENV: 'development',
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config = validator.validate();
      
      expect(config).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should throw error in production with invalid config', () => {
      process.env = {
        NODE_ENV: 'production',
        DATABASE_URL: 'invalid-url',
      };

      expect(() => validator.validate()).toThrow('Environment validation failed');
    });

    it('should validate OpenAI API key format', () => {
      process.env = {
        ...process.env,
        OPENAI_API_KEY: 'invalid-key',
        NODE_ENV: 'test',
      };

      validator.validate();
      const errors = validator.getErrors();
      expect(errors.some(e => e.includes('OPENAI_API_KEY'))).toBe(true);
    });

    it('should validate Stripe key formats', () => {
      process.env = {
        ...process.env,
        STRIPE_SECRET_KEY: 'invalid',
        STRIPE_WEBHOOK_SECRET: 'invalid',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'invalid',
        NODE_ENV: 'test',
      };

      validator.validate();
      const errors = validator.getErrors();
      expect(errors.some(e => e.includes('STRIPE_SECRET_KEY'))).toBe(true);
      expect(errors.some(e => e.includes('STRIPE_WEBHOOK_SECRET'))).toBe(true);
      expect(errors.some(e => e.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'))).toBe(true);
    });

    it('should allow optional environment variables', () => {
      process.env = {
        ...process.env,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        OPENAI_API_KEY: 'sk-test123',
        PINECONE_API_KEY: 'pinecone-key',
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        NODE_ENV: 'test',
        // Omit optional: REDIS_URL, GITHUB_TOKEN
      };

      const config = validator.validate();
      expect(config).toBeDefined();
      expect(validator.isValid()).toBe(true);
      expect(config.REDIS_URL).toBeUndefined();
      expect(config.GITHUB_TOKEN).toBeUndefined();
    });

    it('should use default values for some variables', () => {
      process.env = {
        ...process.env,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        OPENAI_API_KEY: 'sk-test123',
        PINECONE_API_KEY: 'pinecone-key',
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        NODE_ENV: 'test',
      };

      const config = validator.validate();
      expect(config.PINECONE_ENVIRONMENT).toBe('production');
      expect(config.PINECONE_INDEX_NAME).toBe('jarvis-vectors');
      expect(config.PORT).toBe('3000');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EnvValidator.getInstance();
      const instance2 = EnvValidator.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should cache validated config', () => {
      process.env = {
        ...process.env,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        OPENAI_API_KEY: 'sk-test123',
        PINECONE_API_KEY: 'pinecone-key',
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        NODE_ENV: 'test',
      };

      const config1 = validator.validate();
      const config2 = validator.getConfig();
      expect(config1).toBe(config2);
    });
  });

  describe('reset', () => {
    it('should clear cached config and errors', () => {
      process.env = {
        NODE_ENV: 'test',
      };

      validator.validate();
      expect(validator.getErrors().length).toBeGreaterThan(0);
      
      validator.reset();
      expect(validator.getErrors()).toHaveLength(0);
    });
  });
});