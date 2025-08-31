import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    
    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get bot configuration
    const { data: bot, error } = await supabase
      .from('bots')
      .select('id, name, settings, status')
      .eq('id', botId)
      .single();

    if (error || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (bot.status !== 'active') {
      return NextResponse.json(
        { error: 'Bot is not active' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Return customization settings
    return NextResponse.json(
      {
        botId: bot.id,
        name: bot.name,
        settings: {
          // Appearance
          primaryColor: bot.settings?.primaryColor || '#0ea5e9',
          secondaryColor: bot.settings?.secondaryColor || '#f3f4f6',
          fontFamily: bot.settings?.fontFamily || 'system-ui',
          borderRadius: bot.settings?.borderRadius || '16px',
          
          // Widget behavior
          position: bot.settings?.position || 'bottom-right',
          greeting: bot.settings?.greeting || 'Hi! How can I help you today?',
          placeholder: bot.settings?.placeholder || 'Type your message...',
          title: bot.settings?.title || bot.name || 'Chat with us',
          
          // Features
          showTypingIndicator: bot.settings?.showTypingIndicator !== false,
          showTimestamps: bot.settings?.showTimestamps !== false,
          enableFileUpload: bot.settings?.enableFileUpload || false,
          enableVoiceInput: bot.settings?.enableVoiceInput || false,
          enableEmojis: bot.settings?.enableEmojis !== false,
          
          // Triggers
          autoOpen: bot.settings?.autoOpen || false,
          autoOpenDelay: bot.settings?.autoOpenDelay || 3000,
          exitIntentTrigger: bot.settings?.exitIntentTrigger || false,
          scrollTrigger: bot.settings?.scrollTrigger || false,
          scrollTriggerPercentage: bot.settings?.scrollTriggerPercentage || 50,
          
          // Suggested actions
          suggestedActions: bot.settings?.suggestedActions || [
            'How can I get started?',
            'What are your features?',
            'Pricing information',
            'Contact support',
          ],
          
          // Branding
          showPoweredBy: bot.settings?.showPoweredBy !== false,
          customLogo: bot.settings?.customLogo || null,
          
          // Localization
          locale: bot.settings?.locale || 'en',
          translations: bot.settings?.translations || {},
          
          // Advanced
          customCSS: bot.settings?.customCSS || '',
          customJS: bot.settings?.customJS || '',
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Widget customization error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customization settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Parse request body
    const { botId, settings } = await request.json();
    
    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase with user token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Set user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify bot ownership
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*, workspaces!inner(user_id)')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (bot.workspaces.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this bot' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Validate settings
    const validatedSettings = {
      ...bot.settings,
      ...settings,
      // Ensure required fields
      primaryColor: settings.primaryColor || bot.settings?.primaryColor || '#0ea5e9',
      greeting: settings.greeting || bot.settings?.greeting || 'Hi! How can I help you today?',
      title: settings.title || bot.settings?.title || bot.name,
      
      // Validate specific fields
      position: ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(settings.position) 
        ? settings.position 
        : bot.settings?.position || 'bottom-right',
      
      autoOpenDelay: Math.max(0, Math.min(60000, settings.autoOpenDelay || 3000)),
      scrollTriggerPercentage: Math.max(0, Math.min(100, settings.scrollTriggerPercentage || 50)),
    };

    // Update bot settings
    const { data: updatedBot, error: updateError } = await supabase
      .from('bots')
      .update({ 
        settings: validatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', botId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the update
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'bot_settings_updated',
      resource_type: 'bot',
      resource_id: botId,
      metadata: {
        changed_fields: Object.keys(settings),
      },
    });

    return NextResponse.json(
      {
        success: true,
        botId: updatedBot.id,
        settings: updatedBot.settings,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Widget customization update error:', error);
    return NextResponse.json(
      { error: 'Failed to update customization settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}