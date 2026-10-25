/** Integration tests: *.int-spec.ts, real PostgreSQL via TEST_DATABASE_URL. */
module.exports = {
  rootDir: '..',
  testRegex: 'test/.*\\.int-spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  testEnvironment: 'node',
  testTimeout: 30000,
};
