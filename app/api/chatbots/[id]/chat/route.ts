import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, chatRateLimiter } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, chatRateLimiter);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Get user session
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // TODO: Implement actual chat logic with OpenAI
    // For now, return a mock response
    const response = {
      id: `msg_${Date.now()}`,
      chatbotId: params.id,
      message: message,
      response: `This is a mock response to: "${message}". The actual implementation would use OpenAI API here.`,
      timestamp: new Date().toISOString(),
    };

    // Log the conversation to database
    const { error: dbError } = await supabase
      .from('conversations')
      .insert({
        chatbot_id: params.id,
        user_id: user.id,
        message: message,
        response: response.response,
      });

    if (dbError) {
      console.error('Failed to log conversation:', dbError);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, chatRateLimiter);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Get user session
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get conversation history
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('chatbot_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}