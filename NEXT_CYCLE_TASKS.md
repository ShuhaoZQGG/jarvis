# Next Cycle Tasks

## Priority 1: GitHub Integration Enhancements
- Integrate GitHub issue management with proper authentication system
- Implement webhook support for real-time issue updates
- Add issue templates functionality
- Support bulk operations for managing multiple issues
- Move token handling from URL params to secure headers
- Add GitHub Actions integration
- Implement environment-based configuration for GitHub tokens

## Priority 2: Complete Test Suite Stabilization
- Fix remaining 15 failing tests in service layers
- Update service mocks to match new architecture  
- Resolve compilation errors from duplicate declarations
- Target: 100% test pass rate

## Priority 3: Service Layer Updates
- Fix env-validator test warnings
- Update monitoring service tests
- Fix billing service tests  
- Update auth middleware tests (6 failures)
- Fix github service tests
- Fix crawler service tests

## Priority 4: Test Coverage Improvements  
- Achieve 80% test coverage target
- Add missing integration tests
- Improve E2E test scenarios

## Technical Debt
- Refactor duplicate mock declarations in test files
- Standardize test mocking patterns across all modules
- Consider reverting email inputs to type="email" with proper HTML5 handling

## Feature Enhancements
- Implement remaining auth features (OAuth, MFA)
- Complete user management dashboard
- Add admin panel functionality

## Documentation Needs
- Update testing documentation with new patterns
- Document auth context usage in tests
- Create testing best practices guide
- Document GitHub integration setup and configuration
- Add API documentation for GitHub issue endpoints