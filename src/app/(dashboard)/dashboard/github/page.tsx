'use client';

import { useState } from 'react';
import { IssueList } from '@/components/github/issue-list';
import { CreateIssueForm } from '@/components/github/create-issue-form';
import { Github, Settings } from 'lucide-react';

export default function GitHubPage() {
  const [config, setConfig] = useState({
    owner: '',
    repo: '',
    token: '',
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'create'>('issues');

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.owner && config.repo && config.token) {
      setIsConfigured(true);
    }
  };

  const handleReset = () => {
    setIsConfigured(false);
    setConfig({ owner: '', repo: '', token: '' });
  };

  if (!isConfigured) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <Github className="h-6 w-6" />
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                GitHub Integration
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure your GitHub repository to manage issues
            </p>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleConfigure} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="owner" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Repository Owner
                </label>
                <input
                  id="owner"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={config.owner}
                  onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                  placeholder="e.g., facebook"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="repo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Repository Name
                </label>
                <input
                  id="repo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={config.repo}
                  onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                  placeholder="e.g., react"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  GitHub Personal Access Token
                </label>
                <input
                  id="token"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxx"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Generate a token at GitHub Settings → Developer settings → Personal access tokens
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                Connect to GitHub
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">GitHub Issues</h1>
          <p className="text-muted-foreground">
            Managing {config.owner}/{config.repo}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        >
          <Settings className="h-4 w-4 mr-2" />
          Change Repository
        </button>
      </div>

      <div className="space-y-4">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <button
            onClick={() => setActiveTab('issues')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'issues' ? 'bg-background text-foreground shadow-sm' : ''
            }`}
          >
            Issues
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'create' ? 'bg-background text-foreground shadow-sm' : ''
            }`}
          >
            Create Issue
          </button>
        </div>

        {activeTab === 'issues' ? (
          <IssueList
            owner={config.owner}
            repo={config.repo}
            token={config.token}
          />
        ) : (
          <CreateIssueForm
            owner={config.owner}
            repo={config.repo}
            token={config.token}
            onSuccess={() => setActiveTab('issues')}
          />
        )}
      </div>
    </div>
  );
}