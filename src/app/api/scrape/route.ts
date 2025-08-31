import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebScraper } from '@/lib/scraping/scraper';
import { EmbeddingService } from '@/lib/embeddings/embeddings';
import { VectorSearchService } from '@/lib/vector/vector-search';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, urls } = await request.json();

    if (!botId || !urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Missing required fields: botId and urls array' },
        { status: 400 }
      );
    }

    // Verify bot ownership
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('workspace_id')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Verify workspace membership
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', bot.workspace_id)
      .eq('owner_id', user.id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update bot status
    await supabase
      .from('bots')
      .update({ status: 'training' })
      .eq('id', botId);

    // Initialize services
    const scraper = new WebScraper();
    const embeddingService = new EmbeddingService({
      apiKey: process.env.OPENAI_API_KEY!
    });
    const vectorService = new VectorSearchService({
      apiKey: process.env.PINECONE_API_KEY!,
      indexName: process.env.PINECONE_INDEX_NAME || 'jarvis-embeddings'
    });
    vectorService.setEmbeddingService(embeddingService);

    const scrapedPages = [];
    const errors = [];

    // Scrape URLs
    for (const url of urls) {
      try {
        // Check if already scraped
        const { data: existing } = await supabase
          .from('scraped_pages')
          .select('id')
          .eq('bot_id', botId)
          .eq('url', url)
          .single();

        if (existing) {
          console.log(`URL already scraped: ${url}`);
          continue;
        }

        // Scrape the URL
        const scrapedContent = await scraper.scrapeUrl(url);
        
        // Store scraped content
        const { data: page, error: pageError } = await supabase
          .from('scraped_pages')
          .insert({
            bot_id: botId,
            url,
            title: scrapedContent.title,
            content: scrapedContent.content,
            status: 'completed'
          })
          .select()
          .single();

        if (pageError) {
          throw pageError;
        }

        // Chunk the content
        const chunks = embeddingService.chunkText(scrapedContent.content, 512);
        
        // Generate and store embeddings
        const documents = chunks.map((chunk, index) => ({
          id: `${botId}_${page.id}_${index}`,
          text: chunk.text,
          metadata: {
            url,
            title: scrapedContent.title,
            chunkIndex: index,
            pageId: page.id
          }
        }));

        // Index documents in Pinecone
        await vectorService.indexDocuments(documents, botId);

        // Store embedding metadata in Supabase
        for (const [index, chunk] of chunks.entries()) {
          await supabase.from('embeddings').insert({
            bot_id: botId,
            content: chunk.text,
            chunk_index: index,
            pinecone_id: `${botId}_${page.id}_${index}`,
            metadata: {
              url,
              title: scrapedContent.title
            }
          });
        }

        scrapedPages.push({
          url,
          title: scrapedContent.title,
          chunks: chunks.length
        });

      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        errors.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Update scraped_pages with error
        await supabase
          .from('scraped_pages')
          .insert({
            bot_id: botId,
            url,
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
      }
    }

    // Update bot status
    const finalStatus = errors.length === urls.length ? 'error' : 'ready';
    await supabase
      .from('bots')
      .update({ 
        status: finalStatus,
        last_trained_at: new Date().toISOString()
      })
      .eq('id', botId);

    return NextResponse.json({
      success: true,
      scrapedPages,
      errors,
      summary: {
        total: urls.length,
        successful: scrapedPages.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}