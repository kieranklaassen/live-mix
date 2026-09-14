import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const typeChecked = [
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({ ...config, files: ['src/**/*.ts', 'src/**/*.tsx'] }))

// The playground is a Vite app outside the library's type-checked project.
const playground = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ['playground/**/*.ts', 'playground/**/*.tsx'],
}))

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'tmp/**',
      'docs/**',
      '.changeset/**',
      'playground/dist/**',
    ],
  },
  js.configs.recommended,
  ...typeChecked,
  ...playground,
  {
    files: ['playground/**/*.ts', 'playground/**/*.tsx'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: true },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message:
            'Keep imports at the top of the module; dynamic imports hide the dependency graph.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs', '*.js', '*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
)
