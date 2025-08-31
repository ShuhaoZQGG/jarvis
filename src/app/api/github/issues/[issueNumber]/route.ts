import { NextRequest, NextResponse } from 'next/server';
import { GitHubIssueService } from '@/lib/github/issue-service';
import type { UpdateIssueInput } from '@/types/github';

export async function GET(
  request: NextRequest,
  { params }: { params: { issueNumber: string } }
) {
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

    const issueNumber = parseInt(params.issueNumber);
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }

    const service = new GitHubIssueService(token, owner, repo);
    const issue = await service.getIssue(issueNumber);

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Error in GET /api/github/issues/[issueNumber]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { issueNumber: string } }
) {
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
    const { owner, repo, ...updateData } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo' },
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
    const issue = await service.updateIssue(issueNumber, updateData as UpdateIssueInput);

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Error in PATCH /api/github/issues/[issueNumber]:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { issueNumber: string } }
) {
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

    const issueNumber = parseInt(params.issueNumber);
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }

    const service = new GitHubIssueService(token, owner, repo);
    await service.deleteIssue(issueNumber);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/github/issues/[issueNumber]:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue' },
      { status: 500 }
    );
  }
}