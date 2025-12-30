module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }],
    '^.+\\.js$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.test.json'
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      extensionsToTreatAsEsm: ['.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js', '<rootDir>/tests/setup-integration.js'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.test.json'
        }],
        '^.+\\.js$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.test.json'
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      extensionsToTreatAsEsm: ['.ts']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js', '<rootDir>/tests/setup-database.js'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.test.json'
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      extensionsToTreatAsEsm: ['.ts']
    },
    {
      displayName: 'basic',
      testMatch: ['<rootDir>/tests/basic.test.js', '<rootDir>/tests/simple.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.test.json'
        }],
        '^.+\\.js$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.test.json'
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      extensionsToTreatAsEsm: ['.ts']
    }
  ]
};