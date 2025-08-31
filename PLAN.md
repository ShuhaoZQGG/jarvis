# Jarvis MVP - Architectural Plan

## Project Vision
AI-powered chatbot builder enabling instant website integration through URL scraping, custom prompts, or manual content. Revenue target: $15K+ MRR following SiteGPT's model.

## Core Requirements

### Functional Requirements
1. **Content Ingestion System**
   - URL scraping with JavaScript rendering support
   - Manual content upload interface
   - Prompt-based configuration wizard
   - Batch processing queue for large sites

2. **AI Processing Pipeline**
   - RAG-based chatbot using OpenAI embeddings
   - Vector search via Pinecone
   - Context-aware response generation with GPT-4
   - Conversation memory and history

3. **Widget Deployment**
   - One-click JavaScript embed code
   - Multiple widget styles (bubble, sidebar, modal, inline)
   - CDN-hosted for performance
   - Cross-origin communication via PostMessage

4. **User Management**
   - Supabase Auth integration
   - Stripe billing and subscriptions
   - Usage tracking and limits
   - Team collaboration features

5. **Customization Platform**
   - Visual widget builder
   - Brand theming options
   - Behavioral triggers configuration
   - Quick actions and suggested questions

### Non-Functional Requirements
- Response time < 2 seconds
- 99.9% uptime SLA
- GDPR/SOC2 compliant
- Support 10K+ concurrent users
- Mobile-responsive across all devices
- WCAG 2.1 AA accessibility

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase Edge Functions
- **Database**: Supabase (PostgreSQL with RLS)
- **Vector DB**: Pinecone for embeddings
- **AI**: OpenAI GPT-4 API
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **CDN**: Cloudflare
- **Hosting**: Vercel
- **Monitoring**: Sentry + Supabase Analytics

### System Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  User Website   │────▶│ Chat Widget  │────▶│  Edge Function  │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                       │
                                                       ▼
                              ┌────────────────────────┴──────────────┐
                              │         RAG Pipeline                  │
                              │  ┌──────────┐  ┌──────────┐         │
                              │  │Embeddings│──│ Pinecone │         │
                              │  └──────────┘  └──────────┘         │
                              │  ┌──────────┐  ┌──────────┐         │
                              │  │ OpenAI   │──│ Supabase │         │
                              │  └──────────┘  └──────────┘         │
                              └────────────────────────────────────────┘
```

### Database Schema (Existing)
- **workspaces**: Multi-tenant workspace management
- **bots**: Chatbot configurations and settings
- **conversations**: Chat sessions and history
- **messages**: Individual chat messages
- **content_sources**: Scraped/uploaded content
- **embeddings**: Vector embeddings for RAG
- **subscriptions**: Stripe subscription data
- **analytics_events**: Usage and performance metrics

## Implementation Phases

### Phase 1: Core Infrastructure ✅ (Completed)
- Supabase setup with RLS policies
- Authentication system
- Basic database schema
- Edge Functions deployment
- Widget prototype

### Phase 2: Production Readiness ✅ (Current)
- Security hardening (SQL injection fixes)
- Rate limiting implementation
- Analytics infrastructure
- Stripe webhook integration
- Production API endpoints

### Phase 3: Content Pipeline (Next Priority)
- Web scraping with Playwright
- Content cleaning and chunking
- Embedding generation pipeline
- Pinecone vector storage
- Queue system for batch processing

### Phase 4: Chat Experience
- Enhanced widget UI/UX
- Conversation context management
- Quick actions implementation
- Suggested questions
- Multi-language support

### Phase 5: Platform Features
- Visual widget customization
- Analytics dashboard
- Team collaboration
- API access for developers
- Webhook integrations

## Risk Assessment

### Technical Risks
1. **Vector Search Performance**
   - Mitigation: Implement caching layer, optimize chunk size
   
2. **Widget Conflicts**
   - Mitigation: Shadow DOM isolation, namespace all classes

3. **Rate Limiting at Scale**
   - Mitigation: Redis for distributed rate limiting

4. **Build Issues**
   - Mitigation: Fix TypeScript paths, resolve import errors

### Business Risks
1. **OpenAI API Costs**
   - Mitigation: Implement smart caching, usage limits

2. **Data Privacy Compliance**
   - Mitigation: Clear data policies, GDPR tools

3. **Competition**
   - Mitigation: Focus on ease-of-use, fast setup

## Success Metrics
- Time to first chatbot: < 60 seconds
- Widget load time: < 100ms
- Chat response time: < 2 seconds
- User retention: > 40% monthly
- MRR growth: $15K within 6 months

## Immediate Actions (Cycle 25)
1. Fix build and deployment issues
2. Deploy widget to CDN
3. Configure Stripe production webhooks
4. Implement web scraping pipeline
5. Set up production monitoring

## Supabase Integration Points
- **Database**: PostgreSQL with pgvector extension
- **Auth**: User management and JWT tokens
- **Edge Functions**: Chat completion API
- **Storage**: Content and media files
- **Realtime**: Live chat updates
- **Analytics**: Usage tracking

## Security Considerations
- RLS policies on all tables ✅
- Rate limiting on APIs ✅
- SQL injection prevention ✅
- XSS protection in widget
- CORS configuration
- API key rotation
- Audit logging