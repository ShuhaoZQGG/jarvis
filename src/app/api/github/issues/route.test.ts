import { NextRequest } from 'next/server';
import { GET, POST } from './route';

jest.mock('@/lib/github/issue-service');

describe('/api/github/issues', () => {
  const mockToken = 'test-github-token';
  const mockOwner = 'test-owner';
  const mockRepo = 'test-repo';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should require Authorization header', async () => {
      const url = new URL(`http://localhost/api/github/issues?owner=${mockOwner}&repo=${mockRepo}`);
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authorization header with Bearer token is required');
    });

    it('should require owner and repo parameters', async () => {
      const url = new URL('http://localhost/api/github/issues');
      const request = new NextRequest(url, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters: owner, repo');
    });

    it('should accept token from Authorization header', async () => {
      const { GitHubIssueService } = require('@/lib/github/issue-service');
      const mockListIssues = jest.fn().mockResolvedValue([]);
      GitHubIssueService.mockImplementation(() => ({
        listIssues: mockListIssues,
      }));

      const url = new URL(`http://localhost/api/github/issues?owner=${mockOwner}&repo=${mockRepo}`);
      const request = new NextRequest(url, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.issues).toEqual([]);
      expect(GitHubIssueService).toHaveBeenCalledWith(mockToken, mockOwner, mockRepo);
    });

    it('should handle Bearer prefix in Authorization header', async () => {
      const { GitHubIssueService } = require('@/lib/github/issue-service');
      const mockListIssues = jest.fn().mockResolvedValue([]);
      GitHubIssueService.mockImplementation(() => ({
        listIssues: mockListIssues,
      }));

      const url = new URL(`http://localhost/api/github/issues?owner=${mockOwner}&repo=${mockRepo}`);
      const request = new NextRequest(url, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      });

      await GET(request);

      expect(GitHubIssueService).toHaveBeenCalledWith(mockToken, mockOwner, mockRepo);
    });
  });

  describe('POST', () => {
    it('should require Authorization header', async () => {
      const request = new NextRequest('http://localhost/api/github/issues', {
        method: 'POST',
        body: JSON.stringify({
          owner: mockOwner,
          repo: mockRepo,
          title: 'Test Issue',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authorization header with Bearer token is required');
    });

    it('should require owner, repo, and title in body', async () => {
      const request = new NextRequest('http://localhost/api/github/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters: owner, repo, or title');
    });

    it('should accept token from Authorization header', async () => {
      const { GitHubIssueService } = require('@/lib/github/issue-service');
      const mockIssue = { id: 1, title: 'Test Issue', number: 1 };
      const mockCreateIssue = jest.fn().mockResolvedValue(mockIssue);
      GitHubIssueService.mockImplementation(() => ({
        createIssue: mockCreateIssue,
      }));

      const request = new NextRequest('http://localhost/api/github/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          owner: mockOwner,
          repo: mockRepo,
          title: 'Test Issue',
          body: 'Test body',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.issue).toEqual(mockIssue);
      expect(GitHubIssueService).toHaveBeenCalledWith(mockToken, mockOwner, mockRepo);
    });

    it('should not include token in issue data', async () => {
      const { GitHubIssueService } = require('@/lib/github/issue-service');
      const mockCreateIssue = jest.fn().mockResolvedValue({ id: 1 });
      GitHubIssueService.mockImplementation(() => ({
        createIssue: mockCreateIssue,
      }));

      const request = new NextRequest('http://localhost/api/github/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          owner: mockOwner,
          repo: mockRepo,
          title: 'Test Issue',
          body: 'Test body',
        }),
      });

      await POST(request);

      expect(mockCreateIssue).toHaveBeenCalledWith({
        title: 'Test Issue',
        body: 'Test body',
      });
    });
  });
});