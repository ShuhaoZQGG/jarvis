'use client'

import { useState } from 'react'
import { Mail, UserPlus, X, Check, Clock, Send } from 'lucide-react'

export interface TeamMember {
  id: string
  email: string
  name?: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending'
  invited_at?: string
  joined_at?: string
}

interface TeamInvitationsProps {
  workspaceId: string
  members: TeamMember[]
  onInvite?: (email: string, role: string) => Promise<void>
  onRemove?: (memberId: string) => Promise<void>
  onUpdateRole?: (memberId: string, role: string) => Promise<void>
}

export default function TeamInvitations({
  workspaceId,
  members,
  onInvite,
  onRemove,
  onUpdateRole
}: TeamInvitationsProps) {
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (members.find(m => m.email === inviteEmail)) {
      setError('This user is already a member')
      return
    }

    setError('')
    setSuccess('')

    try {
      if (onInvite) {
        await onInvite(inviteEmail, inviteRole)
        setSuccess(`Invitation sent to ${inviteEmail}`)
        setInviteEmail('')
        setIsInviting(false)
      }
    } catch (error) {
      setError('Failed to send invitation')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      if (onRemove) {
        await onRemove(memberId)
      }
    } catch (error) {
      setError('Failed to remove member')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      if (onUpdateRole) {
        await onUpdateRole(memberId, newRole)
      }
    } catch (error) {
      setError('Failed to update role')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-600" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <button
          onClick={() => setIsInviting(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Invite Form */}
      {isInviting && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium mb-4">Invite New Member</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Admins can manage workspace settings and invite members
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsInviting(false)
                  setInviteEmail('')
                  setError('')
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.name || member.email}
                      </div>
                      {member.name && (
                        <div className="text-sm text-gray-500">{member.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.role === 'owner' ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(member.status)}
                      <span className="ml-2 text-sm text-gray-600">
                        {member.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString()
                      : member.invited_at
                      ? `Invited ${new Date(member.invited_at).toLocaleDateString()}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}