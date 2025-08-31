import { NextRequest, NextResponse } from 'next/server';
import { GitHubIssueService } from '@/lib/github/issue-service';
import type { GitHubIssueFilters, CreateIssueInput } from '@/types/github';

export async function GET(request: NextRequest) {
  try {
    // Use Authorization header for token - more secure than query params
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header with Bearer token is required' },
        { status: 401 }
      );
    }

    const filters: GitHubIssueFilters = {
      state: (searchParams.get('state') as 'open' | 'closed' | 'all') || 'open',
      labels: searchParams.get('labels')?.split(','),
      assignee: searchParams.get('assignee') || undefined,
      creator: searchParams.get('creator') || undefined,
      mentioned: searchParams.get('mentioned') || undefined,
      milestone: searchParams.get('milestone') || undefined,
      since: searchParams.get('since') || undefined,
      sort: (searchParams.get('sort') as 'created' | 'updated' | 'comments') || 'created',
      direction: (searchParams.get('direction') as 'asc' | 'desc') || 'desc',
      per_page: parseInt(searchParams.get('per_page') || '30'),
      page: parseInt(searchParams.get('page') || '1'),
    };

    const service = new GitHubIssueService(token, owner, repo);
    const issues = await service.listIssues(filters);

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Error in GET /api/github/issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use Authorization header for token - more secure than body
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header with Bearer token is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { owner, repo, ...issueData } = body;

    if (!owner || !repo || !issueData.title) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, or title' },
        { status: 400 }
      );
    }

    const service = new GitHubIssueService(token, owner, repo);
    const issue = await service.createIssue(issueData as CreateIssueInput);

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Error in POST /api/github/issues:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}