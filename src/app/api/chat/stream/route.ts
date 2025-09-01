import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { OpenAI } from 'openai'
import { VectorSearchService } from '@/lib/vector-search/vector-search'

// Server-Sent Events for streaming chat responses
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { message, botId, sessionId } = await request.json()

  if (!message || !botId) {
    return new Response('Missing required fields', { status: 400 })
  }

  // Verify bot ownership
  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('*, workspaces!inner(owner_id)')
    .eq('id', botId)
    .single()

  if (botError || !bot || bot.workspaces.owner_id !== user.id) {
    return new Response('Bot not found or unauthorized', { status: 404 })
  }

  // Initialize services
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })

  const vectorSearch = new VectorSearchService(
    process.env.PINECONE_API_KEY!,
    process.env.PINECONE_ENVIRONMENT!,
    process.env.PINECONE_INDEX!,
    process.env.OPENAI_API_KEY!
  )

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
        )

        // Search for relevant context
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'searching' })}\n\n`)
        )

        const searchResults = await vectorSearch.search(message, botId, 5)
        const context = searchResults.map(r => r.content).join('\n\n')

        // Build prompt
        const systemPrompt = bot.config?.systemPrompt || `You are a helpful AI assistant for ${bot.name}.`
        const contextPrompt = context 
          ? `Use the following context to answer the user's question:\n\n${context}\n\n`
          : ''

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: contextPrompt },
          { role: 'user', content: message }
        ]

        // Stream OpenAI response
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'streaming' })}\n\n`)
        )

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: messages as any,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000
        })

        let fullResponse = ''
        
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            fullResponse += content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'content',
                content: content 
              })}\n\n`)
            )
          }
        }

        // Save conversation to database
        const conversationData = {
          bot_id: botId,
          session_id: sessionId || `session_${Date.now()}`,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: fullResponse }
          ]
        }

        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('bot_id', botId)
          .eq('session_id', conversationData.session_id)
          .single()

        if (existingConversation) {
          // Append to existing conversation
          await supabase
            .from('conversations')
            .update({
              messages: [...existingConversation.messages, ...conversationData.messages]
            })
            .eq('id', existingConversation.id)
        } else {
          // Create new conversation
          await supabase
            .from('conversations')
            .insert(conversationData)
        }

        // Send completion message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'done',
            response: fullResponse 
          })}\n\n`)
        )

        controller.close()
      } catch (error) {
        console.error('Stream error:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            error: 'Failed to process message' 
          })}\n\n`)
        )
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}