'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Loader2, Users, Building } from 'lucide-react'
import { WorkspaceService, Workspace } from '@/lib/workspace/workspace'
import { publicEnv } from '@/lib/public-env'

export default function WorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    loadWorkspaces()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkspaces = async () => {
    try {
      const service = new WorkspaceService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const data = await service.getWorkspaces()
      setWorkspaces(data)
    } catch (error: any) {
      console.error('Failed to load workspaces:', error)
      if (error.message === 'User not authenticated') {
        router.push('/login')
      } else {
        setError('Failed to load workspaces')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      setError('Workspace name is required')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const service = new WorkspaceService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const workspace = await service.createWorkspace(newWorkspace)
      setWorkspaces([...workspaces, workspace])
      setShowCreateModal(false)
      setNewWorkspace({ name: '', description: '' })
    } catch (error) {
      console.error('Failed to create workspace:', error)
      setError('Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateWorkspace = async () => {
    if (!editingWorkspace) return

    try {
      const service = new WorkspaceService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const updated = await service.updateWorkspace(editingWorkspace.id, {
        name: editingWorkspace.name,
        description: editingWorkspace.description
      })
      
      setWorkspaces(workspaces.map(ws => 
        ws.id === updated.id ? updated : ws
      ))
      setEditingWorkspace(null)
    } catch (error) {
      console.error('Failed to update workspace:', error)
      setError('Failed to update workspace')
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return

    try {
      const service = new WorkspaceService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      await service.deleteWorkspace(id)
      setWorkspaces(workspaces.filter(ws => ws.id !== id))
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      setError('Failed to delete workspace')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Workspace
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map(workspace => (
            <div key={workspace.id} className="bg-white rounded-lg shadow-md p-6">
              {editingWorkspace?.id === workspace.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingWorkspace.name}
                    onChange={(e) => setEditingWorkspace({ ...editingWorkspace, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <textarea
                    value={editingWorkspace.description || ''}
                    onChange={(e) => setEditingWorkspace({ ...editingWorkspace, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingWorkspace(null)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateWorkspace}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingWorkspace(workspace)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkspace(workspace.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{workspace.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {workspace.description || 'No description'}
                  </p>
                  <button
                    onClick={() => router.push(`/workspaces/${workspace.id}`)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Team
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {workspaces.length === 0 && !showCreateModal && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new workspace.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Workspace
              </button>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">Create New Workspace</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My Workspace"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Optional description"
                  />
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
                    setShowCreateModal(false)
                    setNewWorkspace({ name: '', description: '' })
                    setError('')
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={isCreating}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Workspace'
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