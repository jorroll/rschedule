module.exports = {
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  modulePathIgnorePatterns: ['tmp'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // collect coverage throws off the ts-jest source maps :(
  // see https://intellij-support.jetbrains.com/hc/en-us/community/posts/360004708619-TypeScript-and-Jest-debugger-stops-only-on-breakpoints-in-tests-never-in-source-files?page=1#community_comment_360000714019
  collectCoverage: false,
  verbose: false,
  testURL: 'http://localhost/',
  moduleNameMapper: {
    // more specific path maps need to come before less specific path maps
    // as `@rschedule/core` also matches `@rschedule/core/generators`
    '@local-tests/(.*)': '<rootDir>/../../tests/$1',
    '@local-tasks/(.*)': '<rootDir>/../../tasks/$1',
    '@rschedule/core/(.*)': '<rootDir>/../core/src/$1',
    '@rschedule/core': '<rootDir>/../core/src',
    '@rschedule/ical-tools/(.*)': '<rootDir>/../ical-tools/src/$1',
    '@rschedule/ical-tools': '<rootDir>/../ical-tools/src',
    '@rschedule/json-tools/(.*)': '<rootDir>/../json-tools/src/$1',
    '@rschedule/json-tools': '<rootDir>/../json-tools/src',
    '@rschedule/rule-tools/(.*)': '<rootDir>/../rule-tools/src/$1',
    '@rschedule/rule-tools': '<rootDir>/../rule-tools/src',
    '@rschedule/recurrence-rules-resolver/(.*)': '<rootDir>/../recurrence-rules-resolver/src/$1',
    '@rschedule/recurrence-rules-resolver': '<rootDir>/../recurrence-rules-resolver/src',
    '@rschedule/joda-date-adapter/(.*)': '<rootDir>/../joda-date-adapter/src/$1',
    '@rschedule/joda-date-adapter': '<rootDir>/../joda-date-adapter/src',
    '@rschedule/moment-date-adapter/(.*)': '<rootDir>/../moment-date-adapter/src/$1',
    '@rschedule/moment-date-adapter': '<rootDir>/../moment-date-adapter/src',
    '@rschedule/moment-tz-date-adapter/(.*)': '<rootDir>/../moment-tz-date-adapter/src/$1',
    '@rschedule/moment-tz-date-adapter': '<rootDir>/../moment-tz-date-adapter/src',
    '@rschedule/luxon-date-adapter/(.*)': '<rootDir>/../luxon-date-adapter/src/$1',
    '@rschedule/luxon-date-adapter': '<rootDir>/../luxon-date-adapter/src',
    '@rschedule/standard-date-adapter/(.*)': '<rootDir>/../standard-date-adapter/src/$1',
    '@rschedule/standard-date-adapter': '<rootDir>/../standard-date-adapter/src',
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.jest.json',
    },
  },
  preset: 'ts-jest',
  testMatch: null,
  testEnvironment: 'node',
};
