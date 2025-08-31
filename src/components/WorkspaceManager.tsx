'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Settings, Trash2, Edit2, Check, X } from 'lucide-react'

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  member_count: number
  bot_count: number
}

interface WorkspaceManagerProps {
  userId: string
  onWorkspaceSelect?: (workspace: Workspace) => void
}

export default function WorkspaceManager({ userId, onWorkspaceSelect }: WorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' })
  const [editedWorkspace, setEditedWorkspace] = useState({ name: '', description: '' })

  useEffect(() => {
    loadWorkspaces()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadWorkspaces = async () => {
    try {
      // In a real implementation, this would fetch from the API
      const mockWorkspaces: Workspace[] = [
        {
          id: '1',
          name: 'Default Workspace',
          description: 'Your personal workspace',
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          member_count: 1,
          bot_count: 2
        }
      ]
      setWorkspaces(mockWorkspaces)
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newWorkspace.name.trim()) return

    try {
      const workspace: Workspace = {
        id: Date.now().toString(),
        name: newWorkspace.name,
        description: newWorkspace.description,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 1,
        bot_count: 0
      }

      setWorkspaces([...workspaces, workspace])
      setNewWorkspace({ name: '', description: '' })
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }

  const handleEdit = (workspace: Workspace) => {
    setEditingId(workspace.id)
    setEditedWorkspace({
      name: workspace.name,
      description: workspace.description || ''
    })
  }

  const handleUpdate = async (id: string) => {
    if (!editedWorkspace.name.trim()) return

    try {
      setWorkspaces(workspaces.map(ws => 
        ws.id === id
          ? {
              ...ws,
              name: editedWorkspace.name,
              description: editedWorkspace.description,
              updated_at: new Date().toISOString()
            }
          : ws
      ))
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update workspace:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return

    try {
      setWorkspaces(workspaces.filter(ws => ws.id !== id))
    } catch (error) {
      console.error('Failed to delete workspace:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Workspaces</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Create New Workspace</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Workspace Name
              </label>
              <input
                type="text"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter workspace name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter workspace description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewWorkspace({ name: '', description: '' })
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onWorkspaceSelect?.(workspace)}
          >
            {editingId === workspace.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedWorkspace.name}
                  onChange={(e) => setEditedWorkspace({ ...editedWorkspace, name: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <textarea
                  value={editedWorkspace.description}
                  onChange={(e) => setEditedWorkspace({ ...editedWorkspace, description: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                  rows={2}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(null)
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUpdate(workspace.id)
                    }}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {workspace.name}
                  </h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(workspace)
                      }}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {workspace.name !== 'Default Workspace' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(workspace.id)
                        }}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {workspace.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {workspace.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{workspace.member_count} members</span>
                  </div>
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-1" />
                    <span>{workspace.bot_count} bots</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}