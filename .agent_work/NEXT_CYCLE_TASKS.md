# Next Cycle Tasks

## Priority 1: Critical Build Fix
1. **Fix Cheerio/Webpack Build Issue**
   - Current error: ESM module loading incompatibility with Next.js webpack
   - Location: src/lib/scraper/scraper.ts
   - Options:
     a. Replace Cheerio with JSDOM or another webpack-compatible parser
     b. Configure Next.js to handle ESM modules properly
     c. Use dynamic imports with proper webpack configuration
   - Must verify build succeeds before any other work

## Priority 2: Testing
1. Verify all tests pass after build fix
2. Add integration tests for API endpoints
3. Add E2E tests for chat widget

## Priority 3: Phase 2 Features
1. **Authentication & User Management**
   - Integrate Supabase for auth
   - Implement user registration/login
   - Add session management
   
2. **Multi-Tenant Architecture**
   - User workspace isolation
   - Bot ownership and permissions
   - API key management

3. **Billing Integration**
   - Stripe payment processing
   - Usage tracking and limits
   - Subscription tiers

4. **Advanced Crawling**
   - Multi-page website crawling
   - Sitemap support
   - JavaScript-rendered content handling

5. **Conversation Features**
   - Conversation persistence in database
   - Chat history retrieval
   - Analytics tracking

## Technical Debt
1. Replace in-memory rate limiting with Redis
2. Add production logging (e.g., Winston, Pino)
3. Implement proper error tracking (e.g., Sentry)
4. Add API documentation (OpenAPI/Swagger)

## Documentation Needs
1. API usage documentation
2. Widget integration guide
3. Deployment instructions
4. Environment setup guide
