import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthContext } from '@/lib/auth/middleware'

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional()
})

interface RouteContext extends AuthContext {
  params: { workspaceId: string }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  return withAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { user, dbService } = context
      
      const workspace = await dbService.getWorkspace(params.workspaceId)
    
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

      // Verify user has access to this workspace
      if (workspace.owner_id !== user!.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return NextResponse.json({ workspace })
    } catch (error) {
      console.error('Error fetching workspace:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workspace' },
        { status: 500 }
      )
    }
  }, { requireWorkspace: false })(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  return withAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { user, dbService } = context
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = UpdateWorkspaceSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    // Verify workspace exists and user is owner
    const workspace = await dbService.getWorkspace(params.workspaceId)
    
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.owner_id !== user!.id) {
      return NextResponse.json({ error: 'Only workspace owner can update' }, { status: 403 })
    }

      // Update workspace - method not implemented yet in DatabaseService
      // For now, just return the existing workspace
      // TODO: Implement updateWorkspace in DatabaseService
      
      return NextResponse.json({ 
        workspace: { ...workspace, ...validationResult.data },
        message: 'Workspace update not fully implemented yet' 
      })
    } catch (error) {
      console.error('Error updating workspace:', error)
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      )
    }
  }, { requireWorkspace: false })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  return withAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { user, dbService } = context
    
    // Verify workspace exists and user is owner
    const workspace = await dbService.getWorkspace(params.workspaceId)
    
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.owner_id !== user!.id) {
      return NextResponse.json({ error: 'Only workspace owner can delete' }, { status: 403 })
    }

      // Delete workspace - method not implemented yet in DatabaseService
      // For now, just return success
      // TODO: Implement deleteWorkspace in DatabaseService
      
      return NextResponse.json({ message: 'Workspace deletion not fully implemented yet' })
    } catch (error) {
      console.error('Error deleting workspace:', error)
      return NextResponse.json(
        { error: 'Failed to delete workspace' },
        { status: 500 }
      )
    }
  }, { requireWorkspace: false })(request)
}