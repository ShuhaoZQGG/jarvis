import { NextRequest, NextResponse } from 'next/server';
import { GitHubIssueService } from '@/lib/github/issue-service';
import type { CreateCommentInput } from '@/types/github';

export async function GET(
  request: NextRequest,
  { params }: { params: { issueNumber: string } }
) {
  try {
    // TODO: Add authentication when auth system is properly configured
    // For now, require token in request for security

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const token = searchParams.get('token');

    if (!owner || !repo || !token) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const issueNumber = parseInt(params.issueNumber);
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }

    const service = new GitHubIssueService(token, owner, repo);
    const comments = await service.listComments(issueNumber);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error in GET /api/github/issues/[issueNumber]/comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { issueNumber: string } }
) {
  try {
    // TODO: Add authentication when auth system is properly configured
    // For now, require token in request for security

    const body = await request.json();
    const { owner, repo, token, ...commentData } = body;

    if (!owner || !repo || !token || !commentData.body) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const issueNumber = parseInt(params.issueNumber);
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }

    const service = new GitHubIssueService(token, owner, repo);
    const comment = await service.createComment(issueNumber, commentData as CreateCommentInput);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error in POST /api/github/issues/[issueNumber]/comments:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}