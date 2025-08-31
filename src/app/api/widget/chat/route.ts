import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ChatService } from '@/lib/bot/chat-service';
import { v4 as uuidv4 } from 'uuid';

// CORS headers for widget access from external domains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Bot-Id',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// In-memory session storage (use Redis in production)
const chatSessions = new Map<string, ChatService>();

export async function POST(request: NextRequest) {
  try {
    // Get bot ID and API key from headers
    const botId = request.headers.get('X-Bot-Id');
    const apiKey = request.headers.get('X-API-Key');
    
    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse request body
    const { message, sessionId, stream = false } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Verify bot exists and is active
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*, workspaces(*)')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify API key if provided
    if (apiKey) {
      const { data: validKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('workspace_id', bot.workspace_id)
        .eq('key_hash', Buffer.from(apiKey).toString('base64'))
        .eq('is_active', true)
        .single();

      if (!validKey) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Check rate limits
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Simple in-memory rate limiting (in production, use Redis)
    // Allow 60 requests per minute per IP per bot
    const rateLimitKey = `widget:${botId}:${clientIp}`;
    
    // Get or create chat service for this bot
    const serviceKey = `bot_${botId}`;
    let chatService = chatSessions.get(serviceKey);
    
    if (!chatService) {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'jarvis-bots';

      if (!openaiApiKey || !pineconeApiKey) {
        return NextResponse.json(
          { error: 'Chat service not configured' },
          { status: 500, headers: corsHeaders }
        );
      }

      chatService = new ChatService({
        openaiApiKey,
        pineconeApiKey,
        pineconeIndexName,
        model: bot.settings?.model || 'gpt-3.5-turbo',
        temperature: bot.settings?.temperature || 0.7,
        maxTokens: bot.settings?.maxTokens || 500,
        topK: bot.settings?.topK || 5,
        systemPrompt: bot.settings?.systemPrompt || `You are a helpful assistant for ${bot.name}. Answer questions based on the provided context. If you don't know the answer based on the context, say so politely.`
      });
      
      chatSessions.set(serviceKey, chatService);
    }

    // Get or create session
    let chatSessionId = sessionId;
    if (!chatSessionId) {
      chatSessionId = await chatService.createSession(botId, {
        clientIp,
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin')
      });
    } else {
      // Ensure session exists
      const existingSession = await chatService.getSession(chatSessionId);
      if (!existingSession) {
        chatSessionId = await chatService.createSession(botId, {
          clientIp,
          userAgent: request.headers.get('user-agent'),
          origin: request.headers.get('origin')
        });
      }
    }

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await chatService.streamMessage(
              chatSessionId,
              message,
              (chunk) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
              },
              {
                temperature: bot.settings?.temperature,
                maxTokens: bot.settings?.maxTokens,
                topK: bot.settings?.topK
              }
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Handle regular response
    const response = await chatService.sendMessage(
      chatSessionId,
      message,
      {
        temperature: bot.settings?.temperature,
        maxTokens: bot.settings?.maxTokens,
        topK: bot.settings?.topK
      }
    );

    // Store conversation in database
    const conversationId = `${chatSessionId}_${Date.now()}`;
    
    // Store user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      bot_id: botId,
      role: 'user',
      content: message,
      metadata: {
        ip: clientIp,
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin'),
      },
    });

    // Store bot response
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      bot_id: botId,
      role: 'assistant',
      content: response.response,
      metadata: {
        sources: response.sources,
        model: bot.settings?.model || 'gpt-3.5-turbo',
      },
    });

    // Track analytics event
    await supabase.from('analytics_events').insert({
      workspace_id: bot.workspace_id,
      event_type: 'widget_chat',
      event_data: {
        bot_id: botId,
        session_id: chatSessionId,
        conversation_id: conversationId,
        ip: clientIp,
      },
    });

    // Return response
    return NextResponse.json(
      {
        response: response.response,
        sources: response.sources,
        sessionId: chatSessionId,
        conversationId,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Widget chat error:', error);
    
    // Return user-friendly error
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}