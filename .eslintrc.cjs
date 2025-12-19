module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'coverage/',
    'node_modules/'
  ],
  overrides: [
    // Node / CLI / Scripts
    {
      files: ['**/*.cjs', '**/*.js'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script'
      },
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../..', '../../*', '../../../*', '../../../../*'],
                message: 'Imports relativos atravessando domínios são proibidos. Use imports por pacote (@port/*).'
              }
            ]
          }
        ],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'off'
      }
    },
    // Frontend (Vite / React)
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../..', '../../*', '../../../*'],
                message: 'Imports relativos atravessando domínios são proibidos.'
              }
            ]
          }
        ]
      }
    }
  ]
};
