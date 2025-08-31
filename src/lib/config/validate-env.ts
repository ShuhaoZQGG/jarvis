/**
 * Environment validation entry point
 * This file should be imported at the top of the application to validate environment variables
 */

import { envValidator } from './env-validator';

// Validate environment variables on module load
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    const config = envValidator.validate();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
      
      if (!envValidator.isValid()) {
        console.log('⚠️ Some environment variables are missing or invalid:');
        envValidator.getErrors().forEach(error => {
          console.log(`  - ${error}`);
        });
        console.log('Using default values for missing variables.');
      }
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Export the validated config for use in the application
export { env } from './env-validator';