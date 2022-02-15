module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
      ecmaVersion: 2020,
      project: "./tsconfig.json",
      tsconfigRootDir: __dirname,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ["test", "dist"],
  settings: {},
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-types': [
        'error',
        {
            extendDefaults: true,
            types: {
                '{}': false,
            },
        },
    ],
    'import/order': 'error',
    'import/no-cycle': ['error', { ignoreExternal: true }],
    'import/no-self-import': 'error',
    'no-only-tests/no-only-tests': 'error',
    'spaced-comment': ['error', 'always'],
  },
  plugins: ['import'],
};
