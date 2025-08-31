import { Octokit } from '@octokit/rest';
import type {
  GitHubIssue,
  GitHubComment,
  CreateIssueInput,
  UpdateIssueInput,
  CreateCommentInput,
  GitHubIssueFilters,
  GitHubRepository,
  GitHubLabel,
  GitHubMilestone,
} from '@/types/github';

export class GitHubIssueService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async listIssues(filters: GitHubIssueFilters = {}): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: filters.state || 'open',
        labels: filters.labels?.join(','),
        assignee: filters.assignee,
        creator: filters.creator,
        mentioned: filters.mentioned,
        milestone: filters.milestone?.toString(),
        since: filters.since,
        sort: filters.sort || 'created',
        direction: filters.direction || 'desc',
        per_page: filters.per_page || 30,
        page: filters.page || 1,
      });
      return response.data as GitHubIssue[];
    } catch (error) {
      console.error('Error listing issues:', error);
      throw new Error('Failed to list issues');
    }
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return response.data as GitHubIssue;
    } catch (error) {
      console.error('Error getting issue:', error);
      throw new Error('Failed to get issue');
    }
  }

  async createIssue(input: CreateIssueInput): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: input.title,
        body: input.body,
        assignees: input.assignees,
        milestone: input.milestone,
        labels: input.labels,
      });
      return response.data as GitHubIssue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw new Error('Failed to create issue');
    }
  }

  async updateIssue(issueNumber: number, input: UpdateIssueInput): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        title: input.title,
        body: input.body,
        state: input.state,
        assignees: input.assignees,
        milestone: input.milestone,
        labels: input.labels,
      });
      return response.data as GitHubIssue;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw new Error('Failed to update issue');
    }
  }

  async deleteIssue(issueNumber: number): Promise<void> {
    try {
      await this.updateIssue(issueNumber, { state: 'closed' });
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw new Error('Failed to delete issue');
    }
  }

  async listComments(issueNumber: number): Promise<GitHubComment[]> {
    try {
      const response = await this.octokit.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return response.data as GitHubComment[];
    } catch (error) {
      console.error('Error listing comments:', error);
      throw new Error('Failed to list comments');
    }
  }

  async createComment(issueNumber: number, input: CreateCommentInput): Promise<GitHubComment> {
    try {
      const response = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: input.body,
      });
      return response.data as GitHubComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  async updateComment(commentId: number, body: string): Promise<GitHubComment> {
    try {
      const response = await this.octokit.issues.updateComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: commentId,
        body,
      });
      return response.data as GitHubComment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    try {
      await this.octokit.issues.deleteComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: commentId,
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  async listLabels(): Promise<GitHubLabel[]> {
    try {
      const response = await this.octokit.issues.listLabelsForRepo({
        owner: this.owner,
        repo: this.repo,
      });
      return response.data as GitHubLabel[];
    } catch (error) {
      console.error('Error listing labels:', error);
      throw new Error('Failed to list labels');
    }
  }

  async createLabel(name: string, color: string, description?: string): Promise<GitHubLabel> {
    try {
      const response = await this.octokit.issues.createLabel({
        owner: this.owner,
        repo: this.repo,
        name,
        color,
        description,
      });
      return response.data as GitHubLabel;
    } catch (error) {
      console.error('Error creating label:', error);
      throw new Error('Failed to create label');
    }
  }

  async listMilestones(state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubMilestone[]> {
    try {
      const response = await this.octokit.issues.listMilestones({
        owner: this.owner,
        repo: this.repo,
        state,
      });
      return response.data as GitHubMilestone[];
    } catch (error) {
      console.error('Error listing milestones:', error);
      throw new Error('Failed to list milestones');
    }
  }

  async createMilestone(title: string, description?: string, dueOn?: string): Promise<GitHubMilestone> {
    try {
      const response = await this.octokit.issues.createMilestone({
        owner: this.owner,
        repo: this.repo,
        title,
        description,
        due_on: dueOn,
      });
      return response.data as GitHubMilestone;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw new Error('Failed to create milestone');
    }
  }

  async getRepository(): Promise<GitHubRepository> {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return response.data as GitHubRepository;
    } catch (error) {
      console.error('Error getting repository:', error);
      throw new Error('Failed to get repository');
    }
  }

  async searchIssues(query: string): Promise<GitHubIssue[]> {
    try {
      const searchQuery = `${query} repo:${this.owner}/${this.repo}`;
      const response = await this.octokit.search.issuesAndPullRequests({
        q: searchQuery,
        sort: 'created',
        order: 'desc',
      });
      return response.data.items.filter(item => !item.pull_request) as GitHubIssue[];
    } catch (error) {
      console.error('Error searching issues:', error);
      throw new Error('Failed to search issues');
    }
  }

  async assignIssue(issueNumber: number, assignees: string[]): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.addAssignees({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        assignees,
      });
      return response.data as GitHubIssue;
    } catch (error) {
      console.error('Error assigning issue:', error);
      throw new Error('Failed to assign issue');
    }
  }

  async removeAssignees(issueNumber: number, assignees: string[]): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.removeAssignees({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        assignees,
      });
      return response.data as GitHubIssue;
    } catch (error) {
      console.error('Error removing assignees:', error);
      throw new Error('Failed to remove assignees');
    }
  }

  async addLabels(issueNumber: number, labels: string[]): Promise<GitHubLabel[]> {
    try {
      const response = await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        labels,
      });
      return response.data as GitHubLabel[];
    } catch (error) {
      console.error('Error adding labels:', error);
      throw new Error('Failed to add labels');
    }
  }

  async removeLabel(issueNumber: number, name: string): Promise<void> {
    try {
      await this.octokit.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        name,
      });
    } catch (error) {
      console.error('Error removing label:', error);
      throw new Error('Failed to remove label');
    }
  }
}