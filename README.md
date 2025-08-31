# Project Jarvis - Development Plan

## Executive Summary
AI-powered chatbot builder enabling instant website integration through URL scraping, custom prompts, or manual content. Revenue target: $15K+ MRR following SiteGPT's model.

## Core Requirements

### Functional Requirements
- **Content Ingestion**: URL scraping, manual input, prompt-based configuration
- **AI Processing**: RAG-based chatbot using embeddings and vector search
- **Widget Deployment**: One-click JavaScript embed for any website
- **User Management**: Authentication, billing, usage tracking
- **Customization**: Widget appearance, behavior, triggers

### Non-Functional Requirements
- Response time < 2 seconds
- 99.9% uptime
- GDPR/SOC2 compliant
- Support 10K+ concurrent users
- Mobile-responsive

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Edge Functions
- **Database**: Supabase (PostgreSQL + Auth)
- **Vector DB**: Pinecone
- **AI**: OpenAI GPT-4 API
- **Hosting**: Vercel
- **Payments**: Stripe
- **CDN**: Cloudflare

### Core Workflow:

- Scrape website content
- Generate embeddings via OpenAI API
- Store embeddings in Pinecone
- User query → similarity search → prompt GPT-4 → response
- Store conversations in database

### System Architecture
```
User Website → Embed Widget → API Gateway → RAG Pipeline → Response
                                    ↓
                            [Supabase | Pinecone | OpenAI]
```

### MVP Requirements:

- Web scraper - Extract content from URLs
- Embedding pipeline - OpenAI embeddings API
- Vector search - Pinecone or Qdrant
- Chat interface - Basic React frontend
- User management - Auth + billing (Stripe)
- Embed widget - JavaScript snippet for websites

### Modern Stack Alternative:

- Next.js + Vercel (faster than Remix setup)
- Supabase (database + auth)
- Pinecone/Qdrant (vectors)
- OpenAI API
- Stripe (payments)