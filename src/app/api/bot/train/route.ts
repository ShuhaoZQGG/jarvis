import { NextRequest, NextResponse } from 'next/server';
import { BotTrainingService } from '@/lib/bot/training';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { botId, url, urls, content, metadata } = body;

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    // Get bot and verify user has access through workspace membership
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*, workspace:workspaces!inner(*)')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', bot.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized access to bot' },
        { status: 403 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'jarvis-bots';

    if (!openaiApiKey || !pineconeApiKey) {
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    const trainingService = new BotTrainingService({
      openaiApiKey,
      pineconeApiKey,
      pineconeIndexName,
      maxDepth: 2,
      maxPages: 50,
      chunkSize: 512,
      overlapTokens: 50
    });

    let result;

    if (url) {
      result = await trainingService.trainFromUrl(botId, url);
    } else if (urls && Array.isArray(urls)) {
      result = await trainingService.trainFromUrls(botId, urls);
    } else if (content) {
      result = await trainingService.trainFromContent(botId, content, metadata);
    } else {
      return NextResponse.json(
        { error: 'No training data provided. Provide url, urls, or content.' },
        { status: 400 }
      );
    }

    // TODO: Add bot_training_logs table to track training history
    // await supabase
    //   .from('bot_training_logs')
    //   .insert({
    //     bot_id: botId,
    //     user_id: user.id,
    //     status: 'completed',
    //     documents_processed: result.documentsProcessed,
    //     chunks_created: result.chunksCreated,
    //     embeddings_generated: result.embeddingsGenerated,
    //     duration_ms: result.duration,
    //     errors: result.errors,
    //     metadata: { url, urls, content: content ? 'manual' : undefined }
    //   });

    await supabase
      .from('bots')
      .update({ 
        last_trained_at: new Date().toISOString(),
        status: 'active' // Set bot to active after training
      })
      .eq('id', botId);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: 'Training failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    // Get bot and verify user has access through workspace membership
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*, workspace:workspaces!inner(*)')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', bot.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized access to bot' },
        { status: 403 }
      );
    }

    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'jarvis-bots';
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!pineconeApiKey || !openaiApiKey) {
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    const trainingService = new BotTrainingService({
      openaiApiKey,
      pineconeApiKey,
      pineconeIndexName
    });

    await trainingService.deleteTrainingData(botId);

    await supabase
      .from('bots')
      .update({ 
        last_trained_at: null,
        status: 'draft' // Set bot back to draft after clearing training data
      })
      .eq('id', botId);

    return NextResponse.json({
      success: true,
      message: 'Training data deleted successfully'
    });
  } catch (error) {
    console.error('Delete training error:', error);
    return NextResponse.json(
      { error: 'Failed to delete training data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}