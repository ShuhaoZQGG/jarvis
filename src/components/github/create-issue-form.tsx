'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { CreateIssueInput } from '@/types/github';

interface CreateIssueFormProps {
  owner: string;
  repo: string;
  token: string;
  onSuccess?: () => void;
}

export function CreateIssueForm({ owner, repo, token, onSuccess }: CreateIssueFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateIssueInput>({
    title: '',
    body: '',
    labels: [],
    assignees: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/github/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          owner,
          repo,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create issue');
      }

      setSuccess(true);
      setFormData({
        title: '',
        body: '',
        labels: [],
        assignees: [],
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLabelsChange = (value: string) => {
    const labels = value.split(',').map(l => l.trim()).filter(Boolean);
    setFormData({ ...formData, labels });
  };

  const handleAssigneesChange = (value: string) => {
    const assignees = value.split(',').map(a => a.trim()).filter(Boolean);
    setFormData({ ...formData, assignees });
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Create New Issue</h3>
        <p className="text-sm text-muted-foreground">
          Create a new issue in {owner}/{repo}
        </p>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Title *
            </label>
            <input
              id="title"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Issue title"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <textarea
              id="body"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.body || ''}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Describe the issue..."
              rows={6}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="labels" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Labels
            </label>
            <input
              id="labels"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.labels?.join(', ') || ''}
              onChange={(e) => handleLabelsChange(e.target.value)}
              placeholder="bug, enhancement, documentation (comma-separated)"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="assignees" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Assignees
            </label>
            <input
              id="assignees"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.assignees?.join(', ') || ''}
              onChange={(e) => handleAssigneesChange(e.target.value)}
              placeholder="username1, username2 (comma-separated)"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg border bg-destructive/10 p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500 bg-green-50 p-3">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-600">
                  Issue created successfully!
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.title}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Issue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}