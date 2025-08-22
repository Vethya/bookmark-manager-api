// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
});

// Global test teardown
afterAll(async () => {
  // Clean up any global resources if needed
});

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless running in verbose mode
if (!process.env.VERBOSE_TESTS) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}
