# Next Cycle Tasks

## 🔴 CRITICAL - Cycle 10 Revision Required
Cycle 10 has been marked as **NEEDS_REVISION** due to build failures and test issues.

### Immediate Actions Required for Cycle 10 Revision
1. **Fix Build-Breaking Issues**
   - [ ] **CRITICAL**: Fix TypeScript error in `/src/app/api/bots/[botId]/route.ts:21:29`
     - AuthContext type incompatibility with params
     - Preventing production deployment
   - [ ] Ensure `npm run build` completes without errors

2. **Fix Test Infrastructure**
   - [ ] **CRITICAL**: Debug and fix test timeout issue (hangs after 2 minutes)
   - [ ] Fix 34 failing UI/mock tests from Cycle 8
   - [ ] Ensure `npm test` runs to completion
   - [ ] Achieve minimum 80% test coverage

3. **Complete Authentication Features**
   - [ ] Verify login/signup/reset-password pages work end-to-end
   - [ ] Test session management and redirects
   - [ ] Close GitHub Issue #6 after verification
   - [ ] Add integration tests for auth flow

## Priority 2: Deferred Features from Cycle 10
### Production Infrastructure
- [ ] Redis-based rate limiting with ioredis
- [ ] Sentry error tracking integration
- [ ] API documentation generation
- [ ] OAuth provider integration (Google, GitHub)

## Priority 3: Complete AI Features (from earlier cycles)
### WebsiteCrawler (src/lib/crawler/)
- [ ] Playwright-based web scraping
- [ ] Sitemap.xml parsing
- [ ] JavaScript rendering support
- [ ] Robots.txt compliance
- [ ] Clean text extraction
- [ ] URL normalization

### EmbeddingService (src/lib/embeddings/)
- [ ] OpenAI Ada-002 integration
- [ ] Text chunking (512 tokens with 50 token overlap)
- [ ] Batch processing for efficiency
- [ ] Error recovery with exponential backoff
- [ ] Token counting and validation

### PineconeService (src/lib/vectors/)
- [ ] Index initialization and management
- [ ] Namespace per bot strategy
- [ ] Vector upsert operations
- [ ] Similarity search (top-k retrieval)
- [ ] Metadata filtering
- [ ] Index cleanup utilities

### RAGEngine (src/lib/rag/)
- [ ] Context retrieval from vectors
- [ ] Prompt engineering for GPT-4
- [ ] Response generation
- [ ] Conversation history management
- [ ] Response caching (1 hour TTL)
- [ ] Source attribution

## Priority 2: Testing & Quality
- [ ] Fix test infrastructure (timeout issues)
- [ ] Add unit tests for all AI components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for chat flow
- [ ] Performance testing for crawling
- [ ] Load testing for concurrent chats

## Priority 3: Frontend UI (Cycle 8)
### Bot Training Interface
- [ ] URL input with validation
- [ ] Crawl progress indicator
- [ ] Knowledge base viewer
- [ ] Test chat interface
- [ ] Training status dashboard
- [ ] Error handling UI

### Chat Widget MVP
- [ ] Preact-based implementation
- [ ] PostMessage API for communication
- [ ] Basic customization options
- [ ] Mobile responsive design
- [ ] Embed code generator

## Priority 4: Infrastructure (Cycle 9)
### Queue System
- [ ] BullMQ with Redis setup
- [ ] Background job processing
- [ ] Job status tracking
- [ ] Retry mechanisms
- [ ] Dead letter queue

### Monitoring & Logging
- [ ] Sentry error tracking
- [ ] API usage metrics
- [ ] Performance monitoring
- [ ] Cost tracking for APIs
- [ ] Alert system

## Technical Debt from Previous Cycles
- [ ] Fix Next.js Request/Response mock setup in tests
- [ ] Resolve remaining test failures from Cycle 5
- [ ] Implement Redis for production rate limiting
- [ ] Generate API documentation
- [ ] Add missing TypeScript types

## Future Enhancements (Cycles 10-15)
### Widget Excellence
- Multiple widget variants (sidebar, modal, inline)
- Smart triggers (scroll, time, exit-intent)
- Quick action buttons
- Conversation memory across navigation
- A/B testing framework

### Platform Integrations
- Shopify app
- WordPress plugin
- Slack integration
- Microsoft Teams bot
- Webhook system

### Enterprise Features
- White-label support
- SSO integration
- Advanced analytics
- Custom model support
- Data residency options

## Resource Requirements
### API Keys Needed
- [ ] OpenAI API key (GPT-4 and Ada-002)
- [ ] Pinecone API key and environment
- [ ] Redis connection string
- [ ] Sentry DSN

### Infrastructure Setup
- [ ] Vercel deployment configuration
- [ ] Supabase project (already set up)
- [ ] CDN configuration
- [ ] Domain and SSL setup

## Success Metrics for Cycle 7 Revision
- [ ] PR #4 updated with complete implementation
- [ ] All tests passing (100% green)
- [ ] Successful website crawl demonstration
- [ ] Working RAG-based chat responses
- [ ] < 2s response time for chat queries
- [ ] Proper error handling throughout

## Notes
1. **CRITICAL**: Cycle 7 must be completed before moving to Cycle 8
2. The planning and design work is solid, but implementation is missing
3. Focus on getting core AI features working end-to-end
4. Consider cost implications of API usage early
5. Implement caching to reduce API costs
6. Ensure proper error handling for external service failures

## Definition of Done for Cycle 7
- [ ] All AI components implemented and tested
- [ ] PR contains complete implementation code
- [ ] Tests passing without timeouts
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Successfully merged to main branch