# Next Cycle Tasks

## Priority 1: Complete Authentication Features
- [ ] Implement password reset flow
- [ ] Add OAuth UI buttons to login/signup pages
- [ ] Create API key management UI in dashboard

## Priority 2: User Management
- [ ] Create user profile page
- [ ] Implement workspace CRUD operations
- [ ] Add team member invitation system
- [ ] Develop permission system

## Priority 3: Technical Debt
- [ ] Implement missing database methods in DatabaseService:
  - `createSubscription`
  - `updateSubscription`
  - `cancelSubscription`
- [ ] Fix ChatWidget component issues
- [ ] Resolve Sentry configuration warnings

## Priority 4: Production Features
- [ ] Implement Redis rate limiting
- [ ] Complete error tracking setup
- [ ] Add comprehensive logging

## Priority 5: Testing & Documentation
- [ ] Increase test coverage to >80%
- [ ] Add integration tests for OAuth flows
- [ ] Document API endpoints
- [ ] Create user documentation

## Known Issues to Address
- ChatWidget component needs proper implementation
- Billing service database methods are commented out (TODO)
- Some TypeScript types need refinement

## Feature Enhancements
- Add more OAuth providers (Discord, Slack)
- Implement 2FA for enhanced security
- Add email verification flow
- Create admin dashboard for workspace management

## Notes
These tasks were identified during Cycle 1 implementation and review. The authentication core is complete and stable, but these features will enhance the system's completeness and user experience.