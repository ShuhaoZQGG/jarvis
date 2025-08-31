# Next Cycle Tasks

## ✅ Completed in Cycle 25
- **Test Suite**: Achieved 100% pass rate (326/326 tests passing)
- **Test Infrastructure**: Comprehensive test coverage for chat API, bot config, billing
- **Build Status**: All TypeScript errors resolved, build passing

## Critical MVP Features (Priority 1)
1. **Web Scraping Implementation**
   - Use Playwright for dynamic content scraping
   - Handle JavaScript-rendered pages
   - Extract and clean content for embeddings
   - Queue system for batch processing
   - Store scraped content in database

2. **Chat Widget Development**
   - Shadow DOM-based widget for isolation
   - Customizable appearance (colors, position)
   - Mobile-responsive design
   - One-line JavaScript embed code
   - Widget CDN distribution
   - Connect to live API endpoints

3. **Vector Search Integration**
   - Connect to Pinecone/Qdrant for vector storage
   - Implement embedding generation pipeline
   - Create similarity search function
   - Add caching layer for embeddings
   - Test RAG pipeline end-to-end

4. **Stripe Payment Integration**
   - Complete webhook handlers for all events
   - Subscription management UI
   - Usage-based pricing tiers
   - Payment method management
   - Test billing flow end-to-end

## Technical Debt (Priority 2)
1. **Security Fixes**
   - Fix `search_embeddings` function mutable search path (WARN level)
   - Move vector extension out of public schema
   - Review and strengthen RLS policies

2. **Database Optimizations**
   - Remove 35 unused indexes identified by advisors
   - Consolidate multiple permissive RLS policies
   - Fix auth_rls_initplan performance issues in billing_events and analytics_events

3. **Type Safety**
   - Generate proper Supabase TypeScript types
   - Remove 'any' type workarounds
   - Implement missing database methods (createBotIntegration, getBotIntegration)
   - Re-enable GitHub integration service

## Performance Optimizations (Priority 3)
1. **Database**
   - Review and optimize unused indexes
   - Monitor query performance with new RLS policies
   
2. **Edge Functions**
   - Add caching layer for frequent queries
   - Optimize embedding search performance

## Documentation (Priority 4)
1. **User Documentation**
   - Widget installation guide
   - API documentation
   - Troubleshooting guide

2. **Developer Documentation**
   - Architecture overview
   - Deployment guide
   - Contributing guidelines

## Future Enhancements
- Webhook support for real-time updates
- Advanced analytics dashboard
- Multi-language support
- Custom AI model fine-tuning
- A/B testing for bot responses