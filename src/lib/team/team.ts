import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface TeamMember {
  id: string
  workspace_id: string
  user_id: string
  role: MemberRole
  joined_at?: string
}

export interface TeamInvitation {
  id: string
  workspace_id: string
  invited_email: string
  invited_by: string
  role: MemberRole
  status: 'pending' | 'accepted' | 'rejected'
  created_at?: string
}

export interface InviteTeamMemberInput {
  email: string
  role: MemberRole
}

export class TeamService {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async inviteTeamMember(workspaceId: string, data: InviteTeamMemberInput): Promise<TeamInvitation> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: invitation, error } = await this.supabase
      .from('team_invitations')
      .insert({
        workspace_id: workspaceId,
        invited_email: data.email,
        invited_by: user.id,
        role: data.role,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`)
    }

    return invitation
  }

  async getTeamMembers(workspaceId: string): Promise<TeamMember[]> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: members, error } = await this.supabase
      .from('team_members')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new Error(`Failed to fetch team members: ${error.message}`)
    }

    return members || []
  }

  async removeTeamMember(workspaceId: string, memberId: string): Promise<void> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('team_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('id', memberId)

    if (error) {
      throw new Error(`Failed to remove team member: ${error.message}`)
    }
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: MemberRole): Promise<TeamMember> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: member, error } = await this.supabase
      .from('team_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('id', memberId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`)
    }

    return member
  }

  async getPendingInvitations(workspaceId: string): Promise<TeamInvitation[]> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: invitations, error } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`)
    }

    return invitations || []
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) {
      throw new Error(`Failed to cancel invitation: ${error.message}`)
    }
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the invitation
    const { data: invitation, error: fetchError } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('invited_email', user.email)
      .single()

    if (fetchError || !invitation) {
      throw new Error('Invitation not found or not for this user')
    }

    // Create team member entry
    const { error: memberError } = await this.supabase
      .from('team_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role
      })

    if (memberError) {
      throw new Error(`Failed to add team member: ${memberError.message}`)
    }

    // Update invitation status
    const { error: updateError } = await this.supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)

    if (updateError) {
      throw new Error(`Failed to update invitation: ${updateError.message}`)
    }
  }

  async rejectInvitation(invitationId: string): Promise<void> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('team_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId)
      .eq('invited_email', user.email)

    if (error) {
      throw new Error(`Failed to reject invitation: ${error.message}`)
    }
  }
}