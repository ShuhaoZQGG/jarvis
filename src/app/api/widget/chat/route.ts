import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VectorSearchService } from '@/lib/vector/vector-search';

// CORS headers for widget access from external domains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Bot-Id',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
    const { message, sessionId, context } = await request.json();
    
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
    
    const rateLimitKey = `widget:${botId}:${clientIp}`;
    
    // Simple in-memory rate limiting (in production, use Redis)
    // Allow 60 requests per minute per IP per bot
    // This is a placeholder - implement proper rate limiting
    
    // Initialize vector search
    const vectorSearch = new VectorSearchService(
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_INDEX!
    );

    // Search for relevant context
    const searchResults = await vectorSearch.search(
      message,
      botId,
      5 // top 5 results
    );

    // Build context from search results
    const relevantContext = searchResults
      .map(result => result.metadata?.text || '')
      .filter(text => text.length > 0)
      .join('\n\n');

    // Generate response using OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for ${bot.name}. Use the following context to answer questions. If you don't know the answer based on the context, say so politely.\n\nContext:\n${relevantContext}`,
          },
          ...(context || []),
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('Failed to generate response');
    }

    const aiData = await openAIResponse.json();
    const aiMessage = aiData.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

    // Store conversation in database
    const conversationId = `${sessionId || 'anonymous'}_${Date.now()}`;
    
    // Store user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      bot_id: botId,
      role: 'user',
      content: message,
      metadata: {
        ip: clientIp,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Store assistant response
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      bot_id: botId,
      role: 'assistant',
      content: aiMessage,
      metadata: {
        context_used: searchResults.length,
        model: 'gpt-3.5-turbo',
      },
    });

    // Update bot usage statistics
    await supabase.rpc('increment_bot_usage', {
      bot_id: botId,
      messages_count: 2,
    });

    // Send analytics event
    await supabase.from('analytics_events').insert({
      bot_id: botId,
      event_type: 'message_sent',
      metadata: {
        session_id: sessionId,
        message_length: message.length,
        response_length: aiMessage.length,
        context_results: searchResults.length,
      },
    });

    // Return response
    return NextResponse.json(
      {
        response: aiMessage,
        conversationId,
        sessionId: sessionId || conversationId,
        context: searchResults.length,
      },
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );

  } catch (error) {
    console.error('Widget chat error:', error);
    
    return NextResponse.json(
      { 
        error: 'An error occurred processing your message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
}