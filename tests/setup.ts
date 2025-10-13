import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set default test environment variables if not provided
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
  process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  process.env.TEST_DEAL_ID = process.env.TEST_DEAL_ID || 'test-deal-001';
});