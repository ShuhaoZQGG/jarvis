export interface Workspace {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  usage: {
    bots: number
    conversations: number
    limit: number
  }
}

export async function getCurrentWorkspace() {
  const response = await fetch('/api/workspaces/current', {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch workspace')
  }
  
  const data = await response.json()
  return { data }
}

export async function getWorkspaces() {
  const response = await fetch('/api/workspaces', {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch workspaces')
  }
  
  const data = await response.json()
  return { data }
}

export async function createWorkspace(params: { name: string }) {
  const response = await fetch('/api/workspaces', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create workspace')
  }
  
  const data = await response.json()
  return { data }
}

export async function updateWorkspace(id: string, params: Partial<Workspace>) {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update workspace')
  }
  
  const data = await response.json()
  return { data }
}