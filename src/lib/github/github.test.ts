import { GitHubService } from './github';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('GitHubService', () => {
  let service: GitHubService;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = {
      issues: {
        create: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        listForRepo: jest.fn(),
        createComment: jest.fn(),
        listComments: jest.fn(),
        addLabels: jest.fn(),
        removeLabel: jest.fn(),
      },
      search: {
        issuesAndPullRequests: jest.fn(),
      },
    } as any;

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);

    service = new GitHubService({
      accessToken: 'test-token',
      owner: 'test-owner',
      repo: 'test-repo',
    });
  });

  describe('createIssue', () => {
    it('should create a new issue', async () => {
      const mockIssue = {
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open',
        labels: [{ name: 'bug' }],
        assignees: [{ login: 'user1' }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/1',
      };

      mockOctokit.issues.create.mockResolvedValue({ data: mockIssue } as any);

      const result = await service.createIssue({
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug'],
        assignees: ['user1'],
      });

      expect(mockOctokit.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test Issue',
        body: 'Test body',
        labels: ['bug'],
        assignees: ['user1'],
      });

      expect(result).toEqual({
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open',
        labels: ['bug'],
        assignees: ['user1'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        url: 'https://github.com/test/repo/issues/1',
      });
    });

    it('should throw error when repository config is missing', async () => {
      const serviceWithoutRepo = new GitHubService({
        accessToken: 'test-token',
      });

      await expect(
        serviceWithoutRepo.createIssue({ title: 'Test' })
      ).rejects.toThrow('Repository owner and name must be provided');
    });
  });

  describe('getIssue', () => {
    it('should get an issue by number', async () => {
      const mockIssue = {
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open',
        labels: [{ name: 'bug' }],
        assignees: [{ login: 'user1' }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/1',
      };

      mockOctokit.issues.get.mockResolvedValue({ data: mockIssue } as any);

      const result = await service.getIssue(1);

      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
      });

      expect(result.number).toBe(1);
      expect(result.title).toBe('Test Issue');
    });
  });

  describe('updateIssue', () => {
    it('should update an issue', async () => {
      const mockUpdatedIssue = {
        number: 1,
        title: 'Updated Issue',
        body: 'Updated body',
        state: 'closed',
        labels: [],
        assignees: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/1',
      };

      mockOctokit.issues.update.mockResolvedValue({ data: mockUpdatedIssue } as any);

      const result = await service.updateIssue(1, {
        title: 'Updated Issue',
        body: 'Updated body',
        state: 'closed',
      });

      expect(mockOctokit.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        title: 'Updated Issue',
        body: 'Updated body',
        state: 'closed',
      });

      expect(result.title).toBe('Updated Issue');
      expect(result.state).toBe('closed');
    });
  });

  describe('listIssues', () => {
    it('should list repository issues', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Issue 1',
          body: 'Body 1',
          state: 'open',
          labels: [],
          assignees: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/issues/1',
        },
        {
          number: 2,
          title: 'Issue 2',
          body: 'Body 2',
          state: 'open',
          labels: [],
          assignees: [],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          html_url: 'https://github.com/test/repo/issues/2',
        },
      ];

      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues } as any);

      const result = await service.listIssues({
        state: 'open',
        labels: ['bug'],
        sort: 'created',
      });

      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'open',
        labels: 'bug',
        assignee: undefined,
        sort: 'created',
        direction: 'desc',
        per_page: 30,
        page: 1,
      });

      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
      expect(result[1].number).toBe(2);
    });
  });

  describe('searchIssues', () => {
    it('should search issues using GitHub search API', async () => {
      const mockSearchResults = {
        items: [
          {
            number: 1,
            title: 'Bug Issue',
            body: 'Bug description',
            state: 'open',
            labels: [],
            assignees: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            html_url: 'https://github.com/test/repo/issues/1',
          },
          {
            number: 2,
            title: 'Pull Request',
            pull_request: {},
          },
        ],
      };

      mockOctokit.search.issuesAndPullRequests.mockResolvedValue({ 
        data: mockSearchResults 
      } as any);

      const result = await service.searchIssues('bug in:title');

      expect(mockOctokit.search.issuesAndPullRequests).toHaveBeenCalledWith({
        q: 'bug in:title',
        sort: 'created',
        order: 'desc',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bug Issue');
    });
  });

  describe('comments', () => {
    it('should add a comment to an issue', async () => {
      const mockComment = {
        id: 1,
        body: 'Test comment',
        user: { login: 'user1' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockOctokit.issues.createComment.mockResolvedValue({ data: mockComment } as any);

      const result = await service.addComment(1, 'Test comment');

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        body: 'Test comment',
      });

      expect(result.body).toBe('Test comment');
      expect(result.user).toBe('user1');
    });

    it('should list comments for an issue', async () => {
      const mockComments = [
        {
          id: 1,
          body: 'Comment 1',
          user: { login: 'user1' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          body: 'Comment 2',
          user: { login: 'user2' },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockOctokit.issues.listComments.mockResolvedValue({ data: mockComments } as any);

      const result = await service.listComments(1);

      expect(mockOctokit.issues.listComments).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
      });

      expect(result).toHaveLength(2);
      expect(result[0].body).toBe('Comment 1');
      expect(result[1].body).toBe('Comment 2');
    });
  });

  describe('issue state management', () => {
    it('should close an issue', async () => {
      const mockClosedIssue = {
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'closed',
        labels: [],
        assignees: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/1',
      };

      mockOctokit.issues.update.mockResolvedValue({ data: mockClosedIssue } as any);

      const result = await service.closeIssue(1);

      expect(mockOctokit.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        state: 'closed',
      });

      expect(result.state).toBe('closed');
    });

    it('should reopen an issue', async () => {
      const mockOpenedIssue = {
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open',
        labels: [],
        assignees: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/1',
      };

      mockOctokit.issues.update.mockResolvedValue({ data: mockOpenedIssue } as any);

      const result = await service.reopenIssue(1);

      expect(mockOctokit.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        state: 'open',
      });

      expect(result.state).toBe('open');
    });
  });

  describe('labels', () => {
    it('should add labels to an issue', async () => {
      mockOctokit.issues.addLabels.mockResolvedValue({} as any);

      await service.addLabels(1, ['bug', 'enhancement']);

      expect(mockOctokit.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        labels: ['bug', 'enhancement'],
      });
    });

    it('should remove a label from an issue', async () => {
      mockOctokit.issues.removeLabel.mockResolvedValue({} as any);

      await service.removeLabel(1, 'bug');

      expect(mockOctokit.issues.removeLabel).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        name: 'bug',
      });
    });
  });
});