# Next Cycle Tasks

## Critical MVP Features (Priority 1)
1. **Web Scraping Implementation**
   - Use Playwright for dynamic content scraping
   - Handle JavaScript-rendered pages
   - Extract and clean content for embeddings
   - Queue system for batch processing

2. **Chat Widget Development**
   - Shadow DOM-based widget for isolation
   - Customizable appearance (colors, position)
   - Mobile-responsive design
   - One-line JavaScript embed code
   - Widget CDN distribution

3. **Stripe Payment Integration**
   - Subscription management
   - Webhook handlers for billing events
   - Usage-based pricing tiers
   - Payment method management

## Technical Debt (Priority 2)
1. **Security Fixes**
   - Fix `search_embeddings` function mutable search path
   - Consolidate billing_events RLS policies

2. **Test Suite**
   - Fix 27 failing tests
   - Achieve 95% pass rate
   - Add integration tests for new features

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