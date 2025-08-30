'use client'

import { useState } from 'react'
import { Globe, Loader2, Copy, Check } from 'lucide-react'

export default function Dashboard() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [botId, setBotId] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()
      if (data.success) {
        setBotId(data.botId)
      }
    } catch (error) {
      console.error('Error creating bot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyEmbedCode = () => {
    const embedCode = `<script src="${window.location.origin}/widget.js" data-bot-id="${botId}"></script>`
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Create Your Chatbot
        </h1>

        {!botId ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Creating Chatbot...
                  </>
                ) : (
                  'Create Chatbot'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Chatbot Created Successfully!
              </h2>
              <p className="text-gray-600">
                Your chatbot is ready. Add this code to your website:
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Embed Code</span>
                <button
                  onClick={copyEmbedCode}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code className="block text-sm text-gray-800 break-all">
                {`<script src="${window.location.origin}/widget.js" data-bot-id="${botId}"></script>`}
              </code>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setBotId('')
                  setUrl('')
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create Another Chatbot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}