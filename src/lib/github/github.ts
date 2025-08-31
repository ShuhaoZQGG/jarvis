import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  accessToken: string;
  owner?: string;
  repo?: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface CreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface UpdateIssueParams {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

export interface IssueComment {
  id: number;
  body: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchIssuesParams {
  query?: string;
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  sort?: 'created' | 'updated' | 'comments';
  direction?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
}

export class GitHubService {
  private octokit: Octokit;
  private owner?: string;
  private repo?: string;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.accessToken,
    });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  private ensureRepoConfig(owner?: string, repo?: string): { owner: string; repo: string } {
    const finalOwner = owner || this.owner;
    const finalRepo = repo || this.repo;
    
    if (!finalOwner || !finalRepo) {
      throw new Error('Repository owner and name must be provided');
    }
    
    return { owner: finalOwner, repo: finalRepo };
  }

  async createIssue(
    params: CreateIssueParams,
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      const response = await this.octokit.issues.create({
        owner: finalOwner,
        repo: finalRepo,
        title: params.title,
        body: params.body,
        labels: params.labels,
        assignees: params.assignees,
      });

      return this.formatIssue(response.data);
    } catch (error) {
      throw new Error(`Failed to create issue: ${error}`);
    }
  }

  async getIssue(
    issueNumber: number,
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      const response = await this.octokit.issues.get({
        owner: finalOwner,
        repo: finalRepo,
        issue_number: issueNumber,
      });

      return this.formatIssue(response.data);
    } catch (error) {
      throw new Error(`Failed to get issue: ${error}`);
    }
  }

  async updateIssue(
    issueNumber: number,
    params: UpdateIssueParams,
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      const response = await this.octokit.issues.update({
        owner: finalOwner,
        repo: finalRepo,
        issue_number: issueNumber,
        ...params,
      });

      return this.formatIssue(response.data);
    } catch (error) {
      throw new Error(`Failed to update issue: ${error}`);
    }
  }

  async listIssues(
    params?: SearchIssuesParams,
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue[]> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      const response = await this.octokit.issues.listForRepo({
        owner: finalOwner,
        repo: finalRepo,
        state: params?.state || 'open',
        labels: params?.labels?.join(','),
        assignee: params?.assignee,
        sort: params?.sort || 'created',
        direction: params?.direction || 'desc',
        per_page: params?.perPage || 30,
        page: params?.page || 1,
      });

      return response.data.map(issue => this.formatIssue(issue));
    } catch (error) {
      throw new Error(`Failed to list issues: ${error}`);
    }
  }

  async searchIssues(query: string): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.search.issuesAndPullRequests({
        q: query,
        sort: 'created',
        order: 'desc',
      });

      return response.data.items
        .filter(item => !item.pull_request)
        .map(issue => this.formatIssue(issue as any));
    } catch (error) {
      throw new Error(`Failed to search issues: ${error}`);
    }
  }

  async addComment(
    issueNumber: number,
    body: string,
    owner?: string,
    repo?: string
  ): Promise<IssueComment> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      const response = await this.octokit.issues.createComment({
        owner: finalOwner,
        repo: finalRepo,
        issue_number: issueNumber,
        body,
      });

      return {
        id: response.data.id,
        body: response.data.body || '',
        user: response.data.user?.login || 'unknown',
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to add comment: ${error}`);
    }
  }

  async listComments(
    issueNumber: number,
    owner?: string,
    repo?: string
  ): Promise<IssueComment[]> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      const response = await this.octokit.issues.listComments({
        owner: finalOwner,
        repo: finalRepo,
        issue_number: issueNumber,
      });

      return response.data.map(comment => ({
        id: comment.id,
        body: comment.body || '',
        user: comment.user?.login || 'unknown',
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      }));
    } catch (error) {
      throw new Error(`Failed to list comments: ${error}`);
    }
  }

  async closeIssue(
    issueNumber: number,
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'closed' }, owner, repo);
  }

  async reopenIssue(
    issueNumber: number,
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'open' }, owner, repo);
  }

  async addLabels(
    issueNumber: number,
    labels: string[],
    owner?: string,
    repo?: string
  ): Promise<void> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      await this.octokit.issues.addLabels({
        owner: finalOwner,
        repo: finalRepo,
        issue_number: issueNumber,
        labels,
      });
    } catch (error) {
      throw new Error(`Failed to add labels: ${error}`);
    }
  }

  async removeLabel(
    issueNumber: number,
    labelName: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const { owner: finalOwner, repo: finalRepo } = this.ensureRepoConfig(owner, repo);
    
    try {
      await this.octokit.issues.removeLabel({
        owner: finalOwner,
        repo: finalRepo,
        issue_number: issueNumber,
        name: labelName,
      });
    } catch (error) {
      throw new Error(`Failed to remove label: ${error}`);
    }
  }

  private formatIssue(issue: any): GitHubIssue {
    return {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state as 'open' | 'closed',
      labels: issue.labels?.map((label: any) => 
        typeof label === 'string' ? label : label.name
      ) || [],
      assignees: issue.assignees?.map((assignee: any) => assignee.login) || [],
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      url: issue.html_url,
    };
  }
}