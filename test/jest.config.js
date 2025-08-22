module.exports = {
  displayName: 'E2E Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.(e2e-)?spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../src/**/*.(t|j)s',
    '!../src/**/*.spec.ts',
    '!../src/**/*.e2e-spec.ts',
    '!../src/**/*.d.ts',
  ],
  coverageDirectory: '../coverage/e2e',
  moduleFileExtensions: ['js', 'json', 'ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
};
