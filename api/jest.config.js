module.exports = {
  projects: [
    {
      displayName: 'Integration Testing',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: './test',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      transformIgnorePatterns: ['node_modules/(?!(nanoid))'],
      testMatch: ['**/*.spec.ts'],
    },
    {
      displayName: 'Unit Testing',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: './src',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      transformIgnorePatterns: ['node_modules/(?!(nanoid))'],
      testMatch: ['**/*.spec.ts'],
    },
  ],
};
