import { NextRequest, NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'
import { AuthService } from './auth'
import { DatabaseService } from '../database/database'

export interface AuthContext {
  user: User | null
  workspace: any | null
  apiKey?: any
  dbService: DatabaseService
  authService: AuthService
}

export interface AuthOptions {
  requireWorkspace?: boolean
  allowApiKey?: boolean
}

export type AuthenticatedRequest = NextRequest
export type AuthenticatedHandler<T = any> = (
  request: AuthenticatedRequest,
  context: AuthContext & { params?: T }
) => Promise<NextResponse>

/**
 * Higher-order function that wraps API route handlers with authentication
 * @param handler The route handler function to wrap
 * @param options Configuration options for authentication
 * @returns Wrapped handler with authentication
 */
export function withAuth<T = any>(
  handler: AuthenticatedHandler<T>,
  options: AuthOptions = {}
) {
  const { requireWorkspace = true, allowApiKey = false } = options

  return async (request: NextRequest, routeContext?: { params?: T }): Promise<NextResponse> => {
    try {
      // Initialize services
      const authService = new AuthService(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )
      
      const dbService = new DatabaseService(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )

      let user: User | null = null
      let workspace: any = null
      let apiKey: any = undefined

      // Check for API key authentication first
      if (allowApiKey) {
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
          const key = authHeader.substring(7)
          apiKey = await dbService.validateApiKey?.(key)
          
          if (apiKey) {
            // Valid API key found, get the associated workspace
            workspace = await dbService.getWorkspace?.(apiKey.workspace_id)
            
            // Call handler with API key context
            return handler(request, {
              user: null,
              workspace,
              apiKey,
              dbService,
              authService,
              params: routeContext?.params
            })
          } else if (!authHeader.includes('supabase')) {
            // Invalid API key (not a Supabase token)
            return NextResponse.json(
              { error: 'Invalid API key' },
              { status: 401 }
            )
          }
        }
      }

      // Fall back to user authentication
      user = await authService.getCurrentUser()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Handle workspace requirement
      if (requireWorkspace) {
        const workspaces = await dbService.getUserWorkspaces(user.id)
        
        if (workspaces.length === 0) {
          // Create default workspace if none exists
          workspace = await dbService.createWorkspace('Default Workspace', user.id)
        } else {
          // Check for workspace_id in query params or use first workspace
          const workspaceId = request.nextUrl.searchParams.get('workspace_id')
          
          if (workspaceId) {
            // Verify user has access to this workspace
            workspace = workspaces.find(w => w.id === workspaceId)
            if (!workspace) {
              return NextResponse.json(
                { error: 'Access denied to workspace' },
                { status: 403 }
              )
            }
          } else {
            workspace = workspaces[0]
          }
        }
      }

      // Call the wrapped handler with authentication context
      return handler(request, {
        user,
        workspace,
        apiKey,
        dbService,
        authService,
        params: routeContext?.params
      })
      
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Extract workspace ID from request (query params or body)
 */
export async function extractWorkspaceId(
  request: NextRequest,
  defaultWorkspace?: any
): Promise<string | null> {
  // Check query params
  const queryWorkspaceId = request.nextUrl.searchParams.get('workspace_id')
  if (queryWorkspaceId) return queryWorkspaceId

  // Check request body if it's a POST/PUT/PATCH request
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.clone().json()
      if (body.workspace_id) return body.workspace_id
    } catch {
      // Body might not be JSON or might be empty
    }
  }

  // Return default workspace ID if provided
  return defaultWorkspace?.id || null
}

/**
 * Middleware for public endpoints that optionally use authentication
 */
export function withOptionalAuth(
  handler: AuthenticatedHandler
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const authService = new AuthService(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )
      
      const dbService = new DatabaseService(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )

      let user: User | null = null
      let workspace: any = null

      try {
        user = await authService.getCurrentUser()
        
        if (user) {
          const workspaces = await dbService.getUserWorkspaces(user.id)
          if (workspaces.length > 0) {
            workspace = workspaces[0]
          }
        }
      } catch {
        // Authentication is optional, so we ignore errors
      }

      return handler(request, {
        user,
        workspace,
        dbService,
        authService
      })
      
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      // Continue without authentication
      return handler(request, {
        user: null,
        workspace: null,
        dbService: new DatabaseService(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        ),
        authService: new AuthService(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        )
      })
    }
  }
}