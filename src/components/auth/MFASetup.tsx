'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, Key, CheckCircle, XCircle } from 'lucide-react';

export function MFASetup() {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const enableMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      // Enroll MFA
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable MFA');
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify the TOTP code
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: secret!
      });

      if (error) throw error;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: secret!,
        challengeId: data!.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setIsEnabled(true);
      setSuccess(true);
      setQrCode(null);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: secret!
      });

      if (error) throw error;

      setIsEnabled(false);
      setSecret(null);
      setSuccess(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with TOTP-based 2FA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Two-factor authentication has been {isEnabled ? 'enabled' : 'disabled'} successfully
            </AlertDescription>
          </Alert>
        )}

        {!isEnabled && !qrCode && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Set up authenticator app</p>
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator or Authy to generate time-based codes
                </p>
              </div>
            </div>
            <Button onClick={enableMFA} disabled={loading}>
              {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
            </Button>
          </div>
        )}

        {qrCode && !isEnabled && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Scan QR Code</p>
              <div className="bg-white p-4 rounded inline-block">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
              {secret && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Manual entry code:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded">{secret}</code>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="verification" className="text-sm font-medium">
                Enter verification code
              </label>
              <div className="flex gap-2">
                <Input
                  id="verification"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="font-mono"
                />
                <Button onClick={verifyMFA} disabled={loading || !verificationCode}>
                  Verify
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50">
              <Key className="h-4 w-4 text-green-600" />
              <AlertTitle>2FA Enabled</AlertTitle>
              <AlertDescription>
                Your account is protected with two-factor authentication
              </AlertDescription>
            </Alert>
            <Button variant="destructive" onClick={disableMFA} disabled={loading}>
              {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}