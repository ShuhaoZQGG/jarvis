import { createHash, randomBytes } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  hash: string;
  workspaceId: string;
  userId: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  rateLimit?: number;
  permissions: string[];
}

/**
 * Generate a secure API key with a recognizable prefix
 */
export function generateApiKey(prefix = 'jrv'): { key: string; hash: string } {
  // Generate 32 bytes of random data
  const randomData = randomBytes(32);
  
  // Convert to base64 and make URL-safe
  const key = `${prefix}_${randomData.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')}`;
  
  // Create a hash for storage (never store the actual key)
  const hash = createHash('sha256').update(key).digest('hex');
  
  return { key, hash };
}

/**
 * Validate an API key format
 */
export function validateApiKeyFormat(key: string): boolean {
  // Check if it matches our expected format: prefix_base64string
  const pattern = /^jrv_[A-Za-z0-9\-_]{43}$/;
  return pattern.test(key);
}

/**
 * Hash an API key for comparison
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Extract the prefix from an API key
 */
export function extractKeyPrefix(key: string): string {
  const parts = key.split('_');
  return parts[0] || '';
}

/**
 * Check if an API key has expired
 */
export function isKeyExpired(expiresAt?: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * Generate a masked version of the API key for display
 */
export function maskApiKey(key: string): string {
  if (key.length < 12) return '***';
  
  const prefix = key.substring(0, 7);
  const suffix = key.substring(key.length - 4);
  
  return `${prefix}...${suffix}`;
}

/**
 * Default API key permissions
 */
export const DEFAULT_PERMISSIONS = [
  'chatbot:read',
  'chatbot:write',
  'conversation:read',
  'analytics:read',
];

/**
 * Admin API key permissions
 */
export const ADMIN_PERMISSIONS = [
  ...DEFAULT_PERMISSIONS,
  'workspace:manage',
  'user:manage',
  'billing:manage',
  'apikey:manage',
];

/**
 * Check if a set of permissions includes a specific permission
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  // Check for exact match
  if (permissions.includes(permission)) return true;
  
  // Check for wildcard permissions (e.g., 'chatbot:*' matches 'chatbot:read')
  const [resource, action] = permission.split(':');
  return permissions.some(p => {
    const [pResource, pAction] = p.split(':');
    return pResource === resource && (pAction === '*' || pAction === action);
  });
}