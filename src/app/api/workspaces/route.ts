import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthContext } from '@/lib/auth/middleware'

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100)
})

export const GET = withAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { user, dbService } = context
    
    const workspaces = await dbService.getUserWorkspaces(user!.id)
    
    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}, { requireWorkspace: false })

export const POST = withAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { user, dbService } = context
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = CreateWorkspaceSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name } = validationResult.data

    // Create workspace
    const workspace = await dbService.createWorkspace(name, user!.id)
    
    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}, { requireWorkspace: false })