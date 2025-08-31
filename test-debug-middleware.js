const { withAuth } = require('./src/lib/auth/middleware');

// Create mocks
const mockDbService = {
  validateApiKey: jest.fn().mockResolvedValue({ id: 'key-123', workspace_id: 'ws-123' }),
  getWorkspace: jest.fn().mockResolvedValue({ id: 'ws-123' })
};

console.log('mockDbService.validateApiKey:', typeof mockDbService.validateApiKey);
console.log('mockDbService.validateApiKey?.:', typeof mockDbService.validateApiKey?.mockResolvedValue);

// Test optional chaining
const result = mockDbService.validateApiKey?.('test');
console.log('Result:', result);
