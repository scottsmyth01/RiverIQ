export default {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test/env.js'],
  testTimeout: 120000,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/utils/parsers/testParser.js'],
};
