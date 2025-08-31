import { createClient } from '@/lib/supabase/client';

export interface OAuthProvider {
  name: string;
  id: 'google' | 'github' | 'discord';
  icon: string;
  color: string;
}

export const oauthProviders: OAuthProvider[] = [
  {
    name: 'Google',
    id: 'google',
    icon: '🔍',
    color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
  },
  {
    name: 'GitHub',
    id: 'github',
    icon: '🐙',
    color: 'bg-gray-900 hover:bg-gray-800 text-white'
  },
  {
    name: 'Discord',
    id: 'discord',
    icon: '💬',
    color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  }
];

export async function signInWithOAuth(provider: OAuthProvider['id']) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function linkOAuthAccount(provider: OAuthProvider['id']) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${window.location.origin}/settings/accounts`,
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function unlinkOAuthAccount(provider: OAuthProvider['id']) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const identity = user.identities?.find(i => i.provider === provider);
  
  if (!identity) {
    throw new Error(`No ${provider} account linked`);
  }

  const { error } = await supabase.auth.unlinkIdentity({
    identity_id: identity.id,
  });

  if (error) {
    throw error;
  }

  return true;
}