import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

/** Règles classiques « bonnes pratiques » (ESLint + TypeScript). */
const bestPractices = {
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-var': 'error',
  'prefer-const': 'error',
  curly: ['error', 'multi-line'],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-return-assign': ['error', 'except-parens'],
  'no-self-compare': 'error',
  'no-throw-literal': 'error',
  'prefer-promise-reject-errors': 'error',
  'array-callback-return': 'error',
  'default-case-last': 'error',
  'no-lone-blocks': 'error',
  'no-useless-call': 'error',
  'no-useless-concat': 'error',
  'no-useless-return': 'error',
  'prefer-template': 'error',
  'object-shorthand': ['error', 'always'],
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'no-duplicate-imports': 'error',
  'no-param-reassign': ['error', { props: false }],
  'dot-notation': ['error', { allowKeywords: true }],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-import-type-side-effects': 'error',
  '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  '@typescript-eslint/no-useless-empty-export': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  'max-len': [
    'error',
    {
      code: 80,
      tabWidth: 2,
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreTemplateLiterals: true,
    },
  ],
  'padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: 'function', next: 'function' },
    { blankLine: 'always', prev: 'function', next: 'export' },
    { blankLine: 'always', prev: 'function', next: ['const', 'let', 'class'] },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ConditionalExpression',
      message:
        'Les ternaires sont interdits : utilisez if/else ou une fonction nommée.',
    },
  ],
};

/** Bonnes pratiques React (JSX + hooks + Fast Refresh Vite). */
const reactBestPractices = {
  ...react.configs.recommended.rules,
  ...react.configs['jsx-runtime'].rules,
  ...reactHooks.configs['recommended-latest'].rules,
  'react/prop-types': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/jsx-uses-react': 'off',
  'react/no-unstable-nested-components': 'error',
  'react/jsx-no-constructed-context-values': 'error',
  'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
  'react/jsx-no-leaked-render': ['error', { validStrategies: ['coerce'] }],
  'react/no-array-index-key': 'warn',
  'react-refresh/only-export-components': [
    'error',
    { allowConstantExport: true },
  ],
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { sonarjs },
    rules: {
      ...bestPractices,
      '@typescript-eslint/no-non-null-assertion': 'off',
      'id-length': [
        'error',
        { min: 2, exceptions: ['t', '_'], properties: 'never' },
      ],
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
    },
  },
  {
    files: [
      'src/app/App.tsx',
      'src/app/main.tsx',
      'src/app/hooks/**/*.{ts,tsx}',
      'src/app/pages/**/*.{ts,tsx}',
      'src/app/containers/**/*.{ts,tsx}',
      'src/app/components/**/*.{ts,tsx}',
      'src/app/providers/**/*.{ts,tsx}',
    ],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: reactBestPractices,
  },
  {
    files: ['src/**/*.tsx'],
    plugins: {
      react,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/no-unstable-nested-components': 'error',
      'react/jsx-no-constructed-context-values': 'error',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/app/components/**/*.{ts,tsx}'],
    ignores: [
      'src/app/components/modals/**',
      'src/app/components/feedback/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/hooks/*',
                '@/app/providers/*',
                '@/app/containers/*',
                '@/app/view-models/*',
                '@/game/battle/presentation',
                '@/game/battle/controls',
              ],
              message:
                'Composant présentation : props uniquement (pas hooks, contexte, legacy).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      'sonarjs/cognitive-complexity': 'off',
    },
  },
);
