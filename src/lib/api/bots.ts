export interface Bot {
  id: string
  name: string
  url: string
  status: 'active' | 'training' | 'error'
  conversations: number
  created_at: string
}

export async function getBots() {
  const response = await fetch('/api/bots', {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch bots')
  }
  
  const data = await response.json()
  return { data }
}

export async function createBot(params: { name: string; url: string }) {
  const response = await fetch('/api/bots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create bot')
  }
  
  const data = await response.json()
  return { data }
}

export async function updateBot(id: string, params: Partial<Bot>) {
  const response = await fetch(`/api/bots/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update bot')
  }
  
  const data = await response.json()
  return { data }
}

export async function deleteBot(id: string) {
  const response = await fetch(`/api/bots/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete bot')
  }
  
  const data = await response.json()
  return { data }
}