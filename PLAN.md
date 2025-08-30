# Project Jarvis - Cycle 3 Development Plan

## Executive Summary
Build an AI chatbot SaaS platform that allows website owners to create custom chatbots trained on their website content. Revenue target: $15K MRR within 3 months.

## Critical Issue Resolution (Immediate Priority)
### Cheerio/Webpack Build Failure
- **Problem**: ESM module incompatibility blocking deployment
- **Solution**: Replace Cheerio with JSDOM for HTML parsing
- **Timeline**: Day 1 of Cycle 3

## Technical Architecture

### Core Stack
- **Frontend/Backend**: Next.js 14+ with App Router
- **Database**: Supabase (PostgreSQL + Auth)
- **Vector Store**: Pinecone
- **AI**: OpenAI GPT-4 API
- **Hosting**: Vercel
- **Payments**: Stripe
- **Styling**: Tailwind CSS + Radix UI

### System Components
1. **Web Scraper Service**
   - URL content extraction
   - Sitemap parsing
   - JavaScript rendering support
   
2. **Embedding Pipeline**
   - Content chunking strategy
   - OpenAI embeddings generation
   - Pinecone vector storage
   
3. **Chat Engine**
   - RAG implementation
   - Context window management
   - Conversation memory
   
4. **Widget System**
   - Embeddable JavaScript widget
   - Multiple display modes
   - Mobile-responsive design

## Development Phases

### Phase 1: Core Fix & Testing (Days 1-2)
- Fix Cheerio build issue with JSDOM
- Ensure all tests pass
- Deploy to Vercel staging

### Phase 2: Authentication & Multi-Tenancy (Days 3-5)
- Supabase auth integration
- User workspace creation
- Bot management dashboard
- API key generation

### Phase 3: Advanced Features (Days 6-8)
- Multi-page crawling
- Sitemap support
- JavaScript-rendered content
- Conversation persistence

### Phase 4: Monetization (Days 9-10)
- Stripe integration
- Usage tracking
- Subscription tiers
- Billing dashboard

### Phase 5: Production Ready (Days 11-14)
- Redis rate limiting
- Error tracking (Sentry)
- Production logging
- Performance optimization
- Security audit

## Feature Requirements

### MVP Features (Week 1)
- Single URL scraping ✅
- Basic chat interface ✅
- Embeddable widget ✅
- Simple dashboard
- User authentication

### Enhanced Features (Week 2)
- Multi-page crawling
- Custom branding
- Analytics dashboard
- Multiple widget types
- Conversation export

### Differentiators
- **Better UX**: Context-aware greetings, suggested questions
- **Platform Integrations**: Shopify, WordPress plugins
- **Advanced Customization**: CSS overrides, custom actions
- **Performance**: 50ms response time target

## Database Schema

### Tables
```sql
users (Supabase Auth)
workspaces (id, name, owner_id, created_at)
bots (id, workspace_id, name, config, created_at)
conversations (id, bot_id, session_id, messages, created_at)
crawl_jobs (id, bot_id, status, urls, created_at)
embeddings (id, bot_id, content, vector, metadata)
api_keys (id, workspace_id, key_hash, created_at)
subscriptions (id, workspace_id, stripe_id, tier, status)
```

## API Endpoints

### Public API
- `POST /api/chat` - Chat with bot
- `GET /api/widget/:botId` - Get widget configuration

### Authenticated API
- `POST /api/bots` - Create bot
- `POST /api/bots/:id/train` - Train bot on URL
- `GET /api/bots/:id/analytics` - Get bot analytics
- `GET /api/conversations` - List conversations
- `POST /api/billing/subscribe` - Create subscription

## Security Requirements
- JWT authentication
- API rate limiting
- Input sanitization
- XSS protection
- CORS configuration
- Environment variable validation
- SQL injection prevention

## Performance Targets
- Chat response: <500ms
- Widget load: <100KB
- Embedding generation: <2s per page
- 99.9% uptime SLA

## Cost Analysis
- OpenAI API: ~$1,000/month at scale
- Pinecone: $70/month (starter)
- Vercel: $20/month (pro)
- Supabase: $25/month
- Total: ~$1,200/month operating costs

## Success Metrics
- Week 1: Working MVP with 10 test users
- Week 2: 100 signups, 10 paying customers
- Month 1: $1K MRR
- Month 3: $15K MRR target

## Risk Mitigation
- **Technical**: Build issue resolved Day 1
- **Competition**: Fast iteration, unique features
- **Scaling**: Serverless architecture, caching
- **Security**: Regular audits, penetration testing

## Next Immediate Actions
1. Fix Cheerio build issue
2. Deploy staging environment
3. Implement authentication
4. Build user dashboard
5. Add payment processing