import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at?: string
  updated_at?: string
}

export interface CreateWorkspaceInput {
  name: string
  description?: string
}

export interface UpdateWorkspaceInput {
  name?: string
  description?: string
}

export class WorkspaceService {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .insert({
        ...data,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`)
    }

    return workspace
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: workspaces, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)

    if (error) {
      throw new Error(`Failed to fetch workspaces: ${error.message}`)
    }

    return workspaces || []
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch workspace: ${error.message}`)
    }

    return workspace
  }

  async updateWorkspace(id: string, data: UpdateWorkspaceInput): Promise<Workspace> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .update(data)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workspace: ${error.message}`)
    }

    return workspace
  }

  async deleteWorkspace(id: string): Promise<void> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) {
      throw new Error(`Failed to delete workspace: ${error.message}`)
    }
  }
}