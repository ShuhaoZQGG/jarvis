'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2, Copy, Check, Plus, Settings, Trash2, MessageSquare, Activity } from 'lucide-react'
import { AuthService } from '@/lib/auth/auth'
import { publicEnv } from '@/lib/public-env'

interface Bot {
  id: string
  name: string
  url: string
  status: 'active' | 'training' | 'error'
  createdAt: string
  messagesCount: number
}

export default function Dashboard() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [botName, setBotName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [bots, setBots] = useState<Bot[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)

  useEffect(() => {
    checkAuth()
    loadBots()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const authService = new AuthService(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const user = await authService.getCurrentUser()
      if (!user) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  const loadBots = async () => {
    // Mock data for now - will be replaced with actual API call
    const mockBots: Bot[] = [
      {
        id: '1',
        name: 'Support Bot',
        url: 'https://example.com',
        status: 'active',
        createdAt: new Date().toISOString(),
        messagesCount: 245,
      },
      {
        id: '2',
        name: 'Sales Bot',
        url: 'https://shop.example.com',
        status: 'training',
        createdAt: new Date().toISOString(),
        messagesCount: 0,
      },
    ]
    setBots(mockBots)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !botName || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: botName }),
      })

      const data = await response.json()
      if (data.success) {
        const newBot: Bot = {
          id: data.botId,
          name: botName,
          url: url,
          status: 'training',
          createdAt: new Date().toISOString(),
          messagesCount: 0,
        }
        setBots([...bots, newBot])
        setShowCreateForm(false)
        setUrl('')
        setBotName('')
      }
    } catch (error) {
      console.error('Error creating bot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return
    setBots(bots.filter(bot => bot.id !== botId))
  }

  const copyEmbedCode = (botId: string) => {
    const embedCode = `<script src="${window.location.origin}/widget.js" data-bot-id="${botId}"></script>`
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Jarvis Dashboard</h1>
            <div className="flex items-center gap-4">
              <button className="text-gray-500 hover:text-gray-700">Settings</button>
              <button 
                onClick={() => router.push('/logout')}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Bots</p>
                <p className="text-2xl font-bold">{bots.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{bots.filter(b => b.status === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Training</p>
                <p className="text-2xl font-bold">{bots.filter(b => b.status === 'training').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Messages</p>
                <p className="text-2xl font-bold">{bots.reduce((sum, bot) => sum + bot.messagesCount, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bots List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Bots</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Bot
            </button>
          </div>

          {bots.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No bots created yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                Create your first bot
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {bots.map(bot => (
                <div key={bot.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{bot.name}</h3>
                      <p className="text-sm text-gray-500">{bot.url}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bot.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : bot.status === 'training'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {bot.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {bot.messagesCount} messages
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBot(bot)}
                        className="p-2 text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/bot/${bot.id}`)}
                        className="p-2 text-gray-600 hover:text-gray-900"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteBot(bot.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Bot Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Bot</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g., Support Bot"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setUrl('')
                    setBotName('')
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    'Create Bot'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      {selectedBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Embed Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Copy this code and paste it into your website&apos;s HTML:
            </p>
            <div className="bg-gray-50 rounded p-3 mb-4">
              <code className="text-sm break-all">
                {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-bot-id="${selectedBot.id}"></script>`}
              </code>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedBot(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
              <button
                onClick={() => copyEmbedCode(selectedBot.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}