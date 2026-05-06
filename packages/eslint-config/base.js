import eslintJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import pluginImport from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 4,
    quotes: 'single',
    semi: true,
    braceStyle: '1tbs',
  }),
  {
    settings: { 'import-x/internal-regex': '^(@?foundation)/' },
    plugins: {
      'import-x': pluginImport,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import-x/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        alphabetize: { order: 'asc', caseInsensitive: false },
      }],
      'no-restricted-imports': ['error', {
        patterns: [
          {
            regex: '^\\.\\./\\.\\./',
            message: 'Deep relative imports (../../) are not allowed. Use the package alias instead: apps use "@foundation/*", packages use "@foundation/package-name/path".',
          },
        ],
      }],
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.next/**',
      'generated/**',
      '*.config.*',
    ],
  },
];
