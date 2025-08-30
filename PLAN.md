# Project Jarvis - Architectural Plan

## Executive Summary
AI-powered chatbot SaaS that enables instant website integration through URL training, competing with SiteGPT's $15K MRR model with enhanced features and better UX.

## Requirements

### Functional Requirements
1. **Core Features**
   - Website content scraping and processing
   - AI chatbot training on scraped content
   - Embeddable chat widget (60-second setup)
   - Real-time conversation handling
   - Multi-tenant workspace management

2. **Differentiation Features**
   - Multiple widget types (bubble, sidebar, modal, inline)
   - Smart triggers (scroll/time/exit-intent)
   - Context-aware greetings per page
   - Quick action buttons
   - Conversation memory across navigation
   - Platform integrations (Shopify, WordPress)

### Non-Functional Requirements
- Widget load time < 200ms
- Chat response time < 500ms
- Mobile performance score > 90
- WCAG 2.1 AA compliance
- 99.9% uptime SLA

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth)
- **Vector DB**: Pinecone
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Hosting**: Vercel
- **CDN**: Cloudflare
- **Monitoring**: Sentry, Vercel Analytics

### System Components
```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Next.js   │────▶│  Supabase    │────▶│  Pinecone │
│   Frontend  │     │  PostgreSQL  │     │  Vector   │
└─────────────┘     └──────────────┘     └───────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  API Routes │────▶│    OpenAI    │────▶│  Stripe   │
│   Backend   │     │    GPT-4     │     │  Billing  │
└─────────────┘     └──────────────┘     └───────────┘
```

## Implementation Phases

### Phase 1: Foundation (Cycle 6) ✅
- Fix build issues (Cheerio/Webpack)
- Complete test suite fixes
- Frontend components for existing backend
- Redis integration for rate limiting

### Phase 2: Core Product (Cycles 7-8)
- Website crawler with sitemap support
- Vector embedding pipeline
- Chat interface and widget
- Basic dashboard UI
- Conversation persistence

### Phase 3: Monetization (Cycles 9-10)
- Stripe subscription tiers
- Usage metering and limits
- Billing portal
- API key management
- Analytics dashboard

### Phase 4: Scale & Optimize (Cycles 11-12)
- Multi-page crawling
- JavaScript rendering support
- Advanced widget customization
- Platform integrations
- Performance optimization

## Current Status (Post-Cycle 5)

### Completed ✅
- Authentication middleware (HOF pattern)
- Workspace management APIs
- Tiered rate limiting
- Stripe billing integration
- Bot CRUD operations
- 81% test coverage

### Immediate Priorities (Cycle 6)
1. **Fix Critical Build Issue**
   - Cheerio ESM incompatibility
   - Options: Replace with JSDOM or configure webpack

2. **Frontend Integration**
   - Dashboard components
   - Bot configuration UI
   - Chat widget prototype
   - Billing management UI

3. **Production Readiness**
   - Redis for rate limiting
   - API documentation
   - Error tracking setup
   - Deployment pipeline

## Risk Mitigation

### Technical Risks
- **Build Issues**: Already identified, fix prioritized
- **Vector Search Scale**: Pinecone handles 10M+ vectors
- **Response Latency**: Edge functions + caching strategy
- **Cost Management**: Usage-based pricing model

### Business Risks
- **Competition**: Ship MVP in 2 weeks with differentiators
- **OpenAI Dependency**: Abstract LLM interface for flexibility
- **Data Privacy**: GDPR compliance, data encryption

## Success Metrics

### Technical KPIs
- Build success rate: 100%
- Test coverage: >85%
- API response time: <300ms p95
- Widget bundle size: <50KB

### Business KPIs
- Time to first bot: <60 seconds
- User activation rate: >40%
- Chat engagement rate: >25%
- Customer retention: >80% MoM

## Next Steps

1. Fix Cheerio build issue
2. Complete frontend components
3. Integrate Redis
4. Deploy to staging
5. Begin crawler implementation

## Cost Estimates

### Development (Monthly)
- Vercel: $20 (Pro)
- Supabase: $25 (Pro)
- Pinecone: $70 (Starter)
- OpenAI: $500-1000 (usage-based)
- Stripe: 2.9% + $0.30/transaction
- **Total**: ~$1,200/month initially

### Scaling Costs
- 1,000 users: ~$3,000/month
- 5,000 users: ~$8,000/month
- 10,000 users: ~$15,000/month