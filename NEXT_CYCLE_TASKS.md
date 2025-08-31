# Next Cycle Tasks

## Summary
Cycle 18 attempted to implement production features but encountered critical build failures. Files were created in wrong locations and the build is completely broken. Needs significant revision before merging.

## Critical Issues from Cycle 18 (Must Fix First)

### P0 - Build Failures (BLOCKING)
- ❌ Move all `/lib` files to `/src/lib` to match tsconfig paths
- ❌ Create or integrate Supabase server module (missing dependency)
- ❌ Fix module resolution errors preventing compilation
- ❌ Remove duplicate rate limiting (already exists in src/lib/ratelimit.ts)

### P1 - Complete Implementation
- ❌ Add database migrations for API keys table
- ❌ Implement API routes for key management (/api/settings/api-keys)
- ❌ Integrate OAuth buttons into existing auth pages
- ❌ Write tests for new features (currently 0 tests)

## Technical Debt from Cycle 18
- Files created outside project structure conventions
- Duplicate implementations violating DRY principle
- No integration with existing database module
- Import paths don't match tsconfig configuration
- Tests timing out after 2+ minutes

## Deferred Production Features

### Authentication & Security
- Complete OAuth provider integration (buttons not added to UI)
- Configure OAuth apps in provider dashboards (Google, GitHub, Discord)
- Implement CSRF protection
- Add comprehensive input validation

### API Management
- Complete API key management system
- Create database schema for API keys
- Build API routes for CRUD operations
- Add permission-based access control

### Infrastructure
- Set up Redis instance for production (Redis Cloud or Upstash)
- Configure rate limiting properly (use existing implementation)
- Deploy to Vercel with proper environment variables
- Add Sentry error tracking

### Testing & Quality
- Add tests for ALL new features (minimum 80% coverage)
- Fix test timeout issues (Jest configuration)
- Add integration tests for OAuth flow
- Add E2E tests for API key management

## Architectural Improvements Needed
1. **File Organization**: Follow src/ structure consistently
2. **Module Integration**: Use existing modules, don't duplicate
3. **Import Paths**: Ensure all imports match tsconfig paths
4. **Database**: Integrate with existing database module
5. **Testing**: TDD approach - write tests first

## Recommended Approach for Next Cycle
1. **Fix the build FIRST** - nothing else matters if it doesn't compile
2. **Move files to correct locations** before adding any new code
3. **Integrate with existing code** - study what's already there
4. **One feature at a time** - complete fully before moving on
5. **Test everything** - no code without tests

## Notes
- Cycle 18 had good security practices but poor integration
- Build must be green before any PR can be merged
- Consider smaller, incremental changes
- Focus on integration over new features
