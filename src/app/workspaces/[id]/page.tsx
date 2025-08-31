'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Loader2, X } from 'lucide-react'
import { TeamService, TeamMember, TeamInvitation, MemberRole } from '@/lib/team/team'
import { WorkspaceService, Workspace } from '@/lib/workspace/workspace'
import { publicEnv } from '@/lib/public-env'

export default function WorkspaceTeamPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWorkspaceData()
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkspaceData = async () => {
    try {
      const workspaceService = new WorkspaceService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const teamService = new TeamService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const [workspaceData, membersData, invitationsData] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        teamService.getTeamMembers(workspaceId),
        teamService.getPendingInvitations(workspaceId)
      ])

      if (!workspaceData) {
        router.push('/workspaces')
        return
      }

      setWorkspace(workspaceData)
      setMembers(membersData)
      setInvitations(invitationsData)
    } catch (error: any) {
      console.error('Failed to load workspace data:', error)
      if (error.message === 'User not authenticated') {
        router.push('/login')
      } else {
        setError('Failed to load workspace data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Email is required')
      return
    }

    setIsInviting(true)
    setError('')

    try {
      const teamService = new TeamService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const invitation = await teamService.inviteTeamMember(workspaceId, {
        email: inviteEmail,
        role: inviteRole
      })

      setInvitations([...invitations, invitation])
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      console.error('Failed to invite member:', error)
      setError('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const teamService = new TeamService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      await teamService.cancelInvitation(invitationId)
      setInvitations(invitations.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
      setError('Failed to cancel invitation')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const teamService = new TeamService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      await teamService.removeTeamMember(workspaceId, memberId)
      setMembers(members.filter(member => member.id !== memberId))
    } catch (error) {
      console.error('Failed to remove member:', error)
      setError('Failed to remove team member')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: MemberRole) => {
    try {
      const teamService = new TeamService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const updated = await teamService.updateMemberRole(workspaceId, memberId, newRole)
      setMembers(members.map(member => 
        member.id === memberId ? updated : member
      ))
    } catch (error) {
      console.error('Failed to update role:', error)
      setError('Failed to update member role')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Workspace not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/workspaces')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspaces
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
              <p className="text-gray-600 mt-1">{workspace.description || 'Manage team members and permissions'}</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Invite Member
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {members.map(member => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {member.user_id.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">User ID: {member.user_id}</p>
                    <p className="text-sm text-gray-500">Joined {new Date(member.joined_at || '').toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.id, e.target.value as MemberRole)}
                    className="text-sm border-gray-300 rounded-md"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No team members yet
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {invitations.map(invitation => (
                <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invitation.invited_email}</p>
                      <p className="text-sm text-gray-500">Role: {invitation.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="member@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteRole('member')
                    setError('')
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={isInviting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}