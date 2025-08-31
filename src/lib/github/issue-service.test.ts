import { GitHubIssueService } from './issue-service';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('GitHubIssueService', () => {
  let service: GitHubIssueService;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = {
      issues: {
        listForRepo: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        listComments: jest.fn(),
        createComment: jest.fn(),
        updateComment: jest.fn(),
        deleteComment: jest.fn(),
        listLabelsForRepo: jest.fn(),
        createLabel: jest.fn(),
        listMilestones: jest.fn(),
        createMilestone: jest.fn(),
        addAssignees: jest.fn(),
        removeAssignees: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
      },
      repos: {
        get: jest.fn(),
      },
      search: {
        issuesAndPullRequests: jest.fn(),
      },
    } as any;

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);
    service = new GitHubIssueService('test-token', 'test-owner', 'test-repo');
  });

  describe('listIssues', () => {
    it('should list issues with default filters', async () => {
      const mockIssues = [
        { id: 1, number: 1, title: 'Test Issue 1' },
        { id: 2, number: 2, title: 'Test Issue 2' },
      ];
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues } as any);

      const issues = await service.listIssues();

      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'open',
        labels: undefined,
        assignee: undefined,
        creator: undefined,
        mentioned: undefined,
        milestone: undefined,
        since: undefined,
        sort: 'created',
        direction: 'desc',
        per_page: 30,
        page: 1,
      });
      expect(issues).toEqual(mockIssues);
    });

    it('should list issues with custom filters', async () => {
      const mockIssues = [{ id: 1, number: 1, title: 'Bug Issue' }];
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues } as any);

      const issues = await service.listIssues({
        state: 'closed',
        labels: ['bug', 'urgent'],
        assignee: 'john',
        sort: 'updated',
        direction: 'asc',
      });

      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'closed',
        labels: 'bug,urgent',
        assignee: 'john',
        creator: undefined,
        mentioned: undefined,
        milestone: undefined,
        since: undefined,
        sort: 'updated',
        direction: 'asc',
        per_page: 30,
        page: 1,
      });
      expect(issues).toEqual(mockIssues);
    });

    it('should handle errors when listing issues', async () => {
      mockOctokit.issues.listForRepo.mockRejectedValue(new Error('API Error'));

      await expect(service.listIssues()).rejects.toThrow('Failed to list issues');
    });
  });

  describe('getIssue', () => {
    it('should get a single issue', async () => {
      const mockIssue = { id: 1, number: 1, title: 'Test Issue' };
      mockOctokit.issues.get.mockResolvedValue({ data: mockIssue } as any);

      const issue = await service.getIssue(1);

      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
      });
      expect(issue).toEqual(mockIssue);
    });

    it('should handle errors when getting an issue', async () => {
      mockOctokit.issues.get.mockRejectedValue(new Error('Not Found'));

      await expect(service.getIssue(999)).rejects.toThrow('Failed to get issue');
    });
  });

  describe('createIssue', () => {
    it('should create a new issue', async () => {
      const mockIssue = { id: 1, number: 1, title: 'New Issue' };
      mockOctokit.issues.create.mockResolvedValue({ data: mockIssue } as any);

      const issue = await service.createIssue({
        title: 'New Issue',
        body: 'Issue description',
        labels: ['bug'],
        assignees: ['john'],
      });

      expect(mockOctokit.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'New Issue',
        body: 'Issue description',
        labels: ['bug'],
        assignees: ['john'],
        milestone: undefined,
      });
      expect(issue).toEqual(mockIssue);
    });

    it('should handle errors when creating an issue', async () => {
      mockOctokit.issues.create.mockRejectedValue(new Error('Validation Error'));

      await expect(
        service.createIssue({ title: 'Test' })
      ).rejects.toThrow('Failed to create issue');
    });
  });

  describe('updateIssue', () => {
    it('should update an existing issue', async () => {
      const mockIssue = { id: 1, number: 1, title: 'Updated Issue' };
      mockOctokit.issues.update.mockResolvedValue({ data: mockIssue } as any);

      const issue = await service.updateIssue(1, {
        title: 'Updated Issue',
        state: 'closed',
      });

      expect(mockOctokit.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        title: 'Updated Issue',
        state: 'closed',
        body: undefined,
        assignees: undefined,
        milestone: undefined,
        labels: undefined,
      });
      expect(issue).toEqual(mockIssue);
    });

    it('should handle errors when updating an issue', async () => {
      mockOctokit.issues.update.mockRejectedValue(new Error('Not Found'));

      await expect(
        service.updateIssue(999, { title: 'Test' })
      ).rejects.toThrow('Failed to update issue');
    });
  });

  describe('deleteIssue', () => {
    it('should close an issue (GitHub does not support deletion)', async () => {
      const mockIssue = { id: 1, number: 1, state: 'closed' };
      mockOctokit.issues.update.mockResolvedValue({ data: mockIssue } as any);

      await service.deleteIssue(1);

      expect(mockOctokit.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        state: 'closed',
        title: undefined,
        body: undefined,
        assignees: undefined,
        milestone: undefined,
        labels: undefined,
      });
    });
  });

  describe('Comments', () => {
    it('should list comments for an issue', async () => {
      const mockComments = [
        { id: 1, body: 'Comment 1' },
        { id: 2, body: 'Comment 2' },
      ];
      mockOctokit.issues.listComments.mockResolvedValue({ data: mockComments } as any);

      const comments = await service.listComments(1);

      expect(mockOctokit.issues.listComments).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
      });
      expect(comments).toEqual(mockComments);
    });

    it('should create a comment', async () => {
      const mockComment = { id: 1, body: 'New comment' };
      mockOctokit.issues.createComment.mockResolvedValue({ data: mockComment } as any);

      const comment = await service.createComment(1, { body: 'New comment' });

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        body: 'New comment',
      });
      expect(comment).toEqual(mockComment);
    });

    it('should update a comment', async () => {
      const mockComment = { id: 1, body: 'Updated comment' };
      mockOctokit.issues.updateComment.mockResolvedValue({ data: mockComment } as any);

      const comment = await service.updateComment(1, 'Updated comment');

      expect(mockOctokit.issues.updateComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        comment_id: 1,
        body: 'Updated comment',
      });
      expect(comment).toEqual(mockComment);
    });

    it('should delete a comment', async () => {
      mockOctokit.issues.deleteComment.mockResolvedValue({} as any);

      await service.deleteComment(1);

      expect(mockOctokit.issues.deleteComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        comment_id: 1,
      });
    });
  });

  describe('Labels and Milestones', () => {
    it('should list labels', async () => {
      const mockLabels = [
        { id: 1, name: 'bug', color: 'ff0000' },
        { id: 2, name: 'feature', color: '00ff00' },
      ];
      mockOctokit.issues.listLabelsForRepo.mockResolvedValue({ data: mockLabels } as any);

      const labels = await service.listLabels();

      expect(mockOctokit.issues.listLabelsForRepo).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });
      expect(labels).toEqual(mockLabels);
    });

    it('should create a label', async () => {
      const mockLabel = { id: 1, name: 'urgent', color: 'ff0000' };
      mockOctokit.issues.createLabel.mockResolvedValue({ data: mockLabel } as any);

      const label = await service.createLabel('urgent', 'ff0000', 'Urgent issues');

      expect(mockOctokit.issues.createLabel).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        name: 'urgent',
        color: 'ff0000',
        description: 'Urgent issues',
      });
      expect(label).toEqual(mockLabel);
    });

    it('should list milestones', async () => {
      const mockMilestones = [
        { id: 1, number: 1, title: 'v1.0' },
        { id: 2, number: 2, title: 'v2.0' },
      ];
      mockOctokit.issues.listMilestones.mockResolvedValue({ data: mockMilestones } as any);

      const milestones = await service.listMilestones('open');

      expect(mockOctokit.issues.listMilestones).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'open',
      });
      expect(milestones).toEqual(mockMilestones);
    });

    it('should create a milestone', async () => {
      const mockMilestone = { id: 1, number: 1, title: 'v3.0' };
      mockOctokit.issues.createMilestone.mockResolvedValue({ data: mockMilestone } as any);

      const milestone = await service.createMilestone('v3.0', 'Version 3.0', '2024-12-31');

      expect(mockOctokit.issues.createMilestone).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'v3.0',
        description: 'Version 3.0',
        due_on: '2024-12-31',
      });
      expect(milestone).toEqual(mockMilestone);
    });
  });

  describe('searchIssues', () => {
    it('should search for issues', async () => {
      const mockResults = {
        items: [
          { id: 1, number: 1, title: 'Bug Issue' },
          { id: 2, number: 2, title: 'Feature Request', pull_request: {} },
          { id: 3, number: 3, title: 'Another Bug' },
        ],
      };
      mockOctokit.search.issuesAndPullRequests.mockResolvedValue({ data: mockResults } as any);

      const issues = await service.searchIssues('bug');

      expect(mockOctokit.search.issuesAndPullRequests).toHaveBeenCalledWith({
        q: 'bug repo:test-owner/test-repo',
        sort: 'created',
        order: 'desc',
      });
      // Should filter out the item with pull_request
      expect(issues).toEqual([
        { id: 1, number: 1, title: 'Bug Issue' },
        { id: 3, number: 3, title: 'Another Bug' },
      ]);
    });
  });

  describe('Assignees', () => {
    it('should assign users to an issue', async () => {
      const mockIssue = { id: 1, number: 1, assignees: ['john', 'jane'] };
      mockOctokit.issues.addAssignees.mockResolvedValue({ data: mockIssue } as any);

      const issue = await service.assignIssue(1, ['john', 'jane']);

      expect(mockOctokit.issues.addAssignees).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        assignees: ['john', 'jane'],
      });
      expect(issue).toEqual(mockIssue);
    });

    it('should remove assignees from an issue', async () => {
      const mockIssue = { id: 1, number: 1, assignees: [] };
      mockOctokit.issues.removeAssignees.mockResolvedValue({ data: mockIssue } as any);

      const issue = await service.removeAssignees(1, ['john']);

      expect(mockOctokit.issues.removeAssignees).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        assignees: ['john'],
      });
      expect(issue).toEqual(mockIssue);
    });
  });
});