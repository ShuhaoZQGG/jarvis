import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params

    // Get bot configuration (public endpoint for widget)
    const { data: bot, error } = await supabase
      .from('bots')
      .select('id, name, settings')
      .eq('id', botId)
      .single()

    if (error || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Parse settings JSON
    const settings = typeof bot.settings === 'object' && bot.settings !== null 
      ? bot.settings as Record<string, any>
      : {}

    // Return bot configuration for widget
    return NextResponse.json({
      id: bot.id,
      name: bot.name,
      settings: {
        greeting: settings.greeting || 'Hi! How can I help you today?',
        primaryColor: settings.primaryColor || '#0066FF',
        position: settings.position || 'bottom-right',
        widgetType: settings.widgetType || 'bubble',
        autoOpen: settings.autoOpen || false,
        responseDelay: settings.responseDelay || 500,
        placeholder: settings.placeholder || 'Type your message...'
      }
    })
  } catch (error) {
    console.error('Error fetching bot config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bot configuration' },
      { status: 500 }
    )
  }
}