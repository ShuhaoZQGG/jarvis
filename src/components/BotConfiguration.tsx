'use client'

import { useState } from 'react'
import { Trash2, Save, Copy, Check, Eye, Settings, Palette } from 'lucide-react'

interface BotSettings {
  greeting: string
  primaryColor: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  widgetType: 'bubble' | 'sidebar' | 'modal' | 'inline'
  autoOpen: boolean
  responseDelay: number
}

interface Bot {
  id: string
  name: string
  url: string
  status: 'active' | 'training' | 'error'
  conversations: number
  created_at: string
  settings?: BotSettings
}

interface BotConfigurationProps {
  bot: Bot
  onSave: (bot: Bot) => void
  onDelete: (id: string) => void
}

export default function BotConfiguration({ bot, onSave, onDelete }: BotConfigurationProps) {
  const [editedBot, setEditedBot] = useState<Bot>({
    ...bot,
    settings: bot.settings || {
      greeting: 'Hello! How can I help you?',
      primaryColor: '#0066CC',
      position: 'bottom-right',
      widgetType: 'bubble',
      autoOpen: false,
      responseDelay: 500,
    }
  })
  
  const [showEmbedCode, setShowEmbedCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedBot)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      onDelete(bot.id)
    }
  }
  
  const copyEmbedCode = () => {
    const embedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-bot-id="${bot.id}"></script>`
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const positionLabels = {
    'bottom-right': 'Bottom Right',
    'bottom-left': 'Bottom Left',
    'top-right': 'Top Right',
    'top-left': 'Top Left',
  }
  
  const widgetTypeLabels = {
    'bubble': 'Bubble',
    'sidebar': 'Sidebar',
    'modal': 'Modal',
    'inline': 'Inline',
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Basic Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bot Name
            </label>
            <input
              type="text"
              value={editedBot.name}
              onChange={(e) => setEditedBot({ ...editedBot, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={editedBot.url}
              onChange={(e) => setEditedBot({ ...editedBot, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Widget Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Widget Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Greeting Message
            </label>
            <textarea
              value={editedBot.settings?.greeting}
              onChange={(e) => setEditedBot({
                ...editedBot,
                settings: { ...editedBot.settings!, greeting: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={editedBot.settings?.primaryColor}
                onChange={(e) => setEditedBot({
                  ...editedBot,
                  settings: { ...editedBot.settings!, primaryColor: e.target.value }
                })}
                className="w-full h-10 border rounded-md cursor-pointer"
              />
            </div>
            
            <div>
              <label htmlFor="widget-position" className="block text-sm font-medium text-gray-700 mb-1">
                Widget Position
              </label>
              <select
                id="widget-position"
                value={editedBot.settings?.position}
                onChange={(e) => setEditedBot({
                  ...editedBot,
                  settings: { ...editedBot.settings!, position: e.target.value as any }
                })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(positionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Widget Type
              </label>
              <div className="space-y-2">
                {Object.entries(widgetTypeLabels).map(([value, label]) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      value={value}
                      checked={editedBot.settings?.widgetType === value}
                      onChange={(e) => setEditedBot({
                        ...editedBot,
                        settings: { ...editedBot.settings!, widgetType: e.target.value as any }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Behavior
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Auto-open chat"
                    checked={editedBot.settings?.autoOpen}
                    onChange={(e) => setEditedBot({
                      ...editedBot,
                      settings: { ...editedBot.settings!, autoOpen: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Auto-open chat</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Widget Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Widget Preview
        </h2>
        <div 
          data-testid="widget-preview"
          className="relative h-64 bg-gray-100 rounded-lg overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className={`absolute ${
              editedBot.settings?.position === 'bottom-right' ? 'bottom-4 right-4' :
              editedBot.settings?.position === 'bottom-left' ? 'bottom-4 left-4' :
              editedBot.settings?.position === 'top-right' ? 'top-4 right-4' :
              'top-4 left-4'
            }`}>
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: editedBot.settings?.primaryColor }}
              >
                💬
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          aria-label="Delete bot"
        >
          <Trash2 className="w-4 h-4" />
          Delete Bot
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowEmbedCode(true)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            aria-label="Get embed code"
          >
            <Copy className="w-4 h-4" />
            Get Embed Code
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            aria-label="Save changes"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* Embed Code Modal */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Embed Code</h3>
            <div className="bg-gray-50 rounded p-3 mb-4 font-mono text-sm break-all">
              <script>{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-bot-id="${bot.id}"></script>`}</script>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEmbedCode(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
              <button
                onClick={copyEmbedCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
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