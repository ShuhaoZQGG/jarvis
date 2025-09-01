'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  weight: number;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (pwd) => pwd.length >= 8,
    weight: 20
  },
  {
    label: 'Contains uppercase letter',
    test: (pwd) => /[A-Z]/.test(pwd),
    weight: 20
  },
  {
    label: 'Contains lowercase letter',
    test: (pwd) => /[a-z]/.test(pwd),
    weight: 20
  },
  {
    label: 'Contains number',
    test: (pwd) => /\d/.test(pwd),
    weight: 20
  },
  {
    label: 'Contains special character',
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    weight: 20
  }
];

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [metRequirements, setMetRequirements] = useState<boolean[]>([]);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setMetRequirements([]);
      return;
    }

    let score = 0;
    const met = requirements.map(req => {
      const passes = req.test(password);
      if (passes) score += req.weight;
      return passes;
    });

    // Bonus points for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Check for common patterns (penalties)
    if (/^[a-z]+$/.test(password)) score -= 10; // Only lowercase
    if (/^[A-Z]+$/.test(password)) score -= 10; // Only uppercase
    if (/^[0-9]+$/.test(password)) score -= 10; // Only numbers
    if (/^(.)\1+$/.test(password)) score -= 20; // Repeated characters

    setStrength(Math.max(0, Math.min(100, score)));
    setMetRequirements(met);
  }, [password]);

  const getStrengthLabel = () => {
    if (!password) return '';
    if (strength < 30) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 70) return 'Fair';
    if (strength < 90) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = () => {
    if (!password) return 'bg-gray-200';
    if (strength < 30) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 70) return 'bg-yellow-500';
    if (strength < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (!password) return 'text-gray-500';
    if (strength < 30) return 'text-red-600';
    if (strength < 50) return 'text-orange-600';
    if (strength < 70) return 'text-yellow-600';
    if (strength < 90) return 'text-blue-600';
    return 'text-green-600';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Password Strength</span>
          <span className={cn('text-sm font-medium', getTextColor())}>
            {getStrengthLabel()}
          </span>
        </div>
        <Progress value={strength} className="h-2">
          <div
            className={cn('h-full transition-all duration-300', getStrengthColor())}
            style={{ width: `${strength}%` }}
          />
        </Progress>
      </div>

      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((req, index) => {
            const met = metRequirements[index];
            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  met ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {met ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {password.length > 0 && strength < 50 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-800">
            This password is too weak. Consider using a mix of letters, numbers, and symbols.
          </p>
        </div>
      )}
    </div>
  );
}