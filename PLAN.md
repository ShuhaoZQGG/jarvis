# Jarvis MVP Development Plan - Cycle 24

## Executive Summary
AI-powered chatbot builder for instant website integration via URL scraping with $15K+ MRR target following SiteGPT model. Building on existing foundation with GitHub issue management, now focusing on core chatbot functionality.

## Core Requirements

### Functional Requirements (from README.md)
1. **Content Ingestion**: URL scraping, manual input, prompt configuration
2. **AI Processing**: RAG-based chatbot with embeddings/vector search
3. **Widget Deployment**: One-click JavaScript embed
4. **User Management**: Authentication, billing, usage tracking
5. **Customization**: Widget appearance, behavior, triggers
6. **GitHub Integration**: Issue management (COMPLETED in Cycle 23)

### Non-Functional Requirements
- Response time < 2 seconds
- 99.9% uptime
- GDPR/SOC2 compliant
- 10K+ concurrent users
- Mobile-responsive

## Technical Architecture

### Tech Stack (Confirmed)
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS ✅
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Vector DB**: Pinecone
- **AI**: OpenAI GPT-4 API
- **Hosting**: Vercel
- **Payments**: Stripe
- **CDN**: Cloudflare
- **Testing**: Jest + React Testing Library ✅

### Database Schema (Supabase)
```sql
-- Core tables needed
users (id, email, created_at, metadata)
workspaces (id, name, owner_id, plan, created_at)
bots (id, workspace_id, name, url, settings, status)
conversations (id, bot_id, session_id, created_at)
messages (id, conversation_id, role, content, timestamp)
embeddings (id, bot_id, content, vector, metadata)
subscriptions (id, workspace_id, stripe_id, status, plan)
api_keys (id, workspace_id, key_hash, permissions)
```

### Core Workflow
1. **Ingestion**: Scrape website → Process HTML → Generate embeddings → Store in Pinecone
2. **Query**: User message → Vector search → Context retrieval → GPT-4 → Response
3. **Widget**: Load script → Establish session → WebSocket/REST → Real-time chat

## Implementation Phases

### Phase 1: Foundation & Auth (Week 1) - PRIORITY
- [ ] Fix authentication (Issue #6 - Login page 404)
- [ ] Supabase setup with complete auth tables
- [ ] User registration/login flows
- [ ] Session management
- [ ] Protected routes
- [ ] Workspace CRUD operations

### Phase 2: Web Scraping & Processing (Week 1-2)
- [ ] Playwright-based web scraper
- [ ] HTML content extraction
- [ ] Content chunking strategy
- [ ] Queue system for async processing
- [ ] Error handling and retries

### Phase 3: AI Pipeline (Week 2)
- [ ] OpenAI integration service
- [ ] Embedding generation pipeline
- [ ] Pinecone vector storage setup
- [ ] RAG query system
- [ ] Context window optimization

### Phase 4: Chat Interface (Week 2-3)
- [ ] Chat UI components (leverage existing design)
- [ ] Real-time messaging with Supabase Realtime
- [ ] Session/conversation management
- [ ] Message history storage
- [ ] Typing indicators

### Phase 5: Widget System (Week 3)
- [ ] Standalone widget build
- [ ] Shadow DOM implementation
- [ ] PostMessage communication
- [ ] CDN deployment setup
- [ ] Embed code generator

### Phase 6: Testing & Quality (Week 3-4)
- [ ] Fix remaining test failures (target 95%+ pass rate)
- [ ] Integration tests for critical flows
- [ ] E2E tests for widget
- [ ] Performance optimization
- [ ] Security audit

### Phase 7: Monetization (Week 4)
- [ ] Stripe integration
- [ ] Subscription tiers
- [ ] Usage tracking/limits
- [ ] Billing dashboard
- [ ] Payment webhooks

## Database Migrations Required
```sql
-- 001_auth_and_users.sql
-- 002_workspaces_and_bots.sql
-- 003_conversations_and_messages.sql
-- 004_embeddings_and_vectors.sql
-- 005_subscriptions_and_billing.sql
-- 006_api_keys_and_permissions.sql
```

## Supabase Edge Functions Needed
1. `chat-completion` - Main chat API endpoint
2. `webhook-stripe` - Payment webhook handler
3. `scrape-website` - Async scraping trigger
4. `generate-embeddings` - Embedding pipeline
5. `analytics-collector` - Usage tracking

## Critical Path Items
1. **Fix Auth (Issue #6)** - Blocking user access
2. **Fix Test Failures** - Currently 86% pass rate
3. **Supabase Integration** - Core infrastructure
4. **Vector Search Setup** - Core functionality
5. **Widget Development** - Customer integration

## Risk Mitigation
1. **Test Failures**: Fix React act warnings, improve test utilities
2. **Scalability**: Implement connection pooling, caching
3. **Costs**: Token limits per plan, usage monitoring
4. **Security**: RLS policies, API key validation
5. **Performance**: Edge caching, CDN, code splitting

## Success Metrics
- 95%+ test pass rate
- <2s average response time
- 100+ beta users first month
- $1K MRR within 60 days
- Zero critical security issues

## Immediate Next Steps (This Cycle)
1. Create/fix login and signup pages
2. Complete Supabase auth integration
3. Design and create initial database schema
4. Fix failing tests (especially React act warnings)
5. Create basic workspace management

## Integration with Existing Work
- **GitHub Integration**: Already completed (Cycle 23)
- **UI Components**: Reuse existing design system
- **Test Infrastructure**: Fix and enhance existing setup
- **Type System**: Leverage existing TypeScript setup

## Technical Debt to Address
- Fix 27 failing tests across components
- Resolve React act warnings
- Replace mock data with real APIs
- Improve error handling
- Add proper loading states

## Architecture Decisions Made
- Supabase for backend (auth, database, realtime, storage)
- Pinecone for vector search (serverless option)
- Vercel for hosting (optimized for Next.js)
- Shadow DOM for widget isolation
- PostgreSQL with RLS for multi-tenancy