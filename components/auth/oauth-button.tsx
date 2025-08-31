'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithOAuth, type OAuthProvider } from '@/lib/auth/oauth-providers';
import { toast } from 'sonner';

interface OAuthButtonProps {
  provider: OAuthProvider;
  action?: 'sign-in' | 'sign-up';
}

export function OAuthButton({ provider, action = 'sign-in' }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthSignIn = async () => {
    setIsLoading(true);
    
    try {
      await signInWithOAuth(provider.id);
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error(`Failed to ${action} with ${provider.name}`);
      setIsLoading(false);
    }
  };

  const actionText = action === 'sign-up' ? 'Sign up' : 'Sign in';

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full ${provider.color}`}
      onClick={handleOAuthSignIn}
      disabled={isLoading}
    >
      <span className="mr-2 text-lg">{provider.icon}</span>
      {isLoading ? 'Connecting...' : `${actionText} with ${provider.name}`}
    </Button>
  );
}