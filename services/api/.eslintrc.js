module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    root: true,

    env: {
        node: true,
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            typescript: {
                project: './tsconfig.json',
            },
        },
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        // 'prettier',
        // 'plugin:prettier/recommended',
        // 'plugin:jest/recommended',
    ],
    ignorePatterns: ['test', '**/dist/**'],

    rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '_' }],
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
    plugins: ['import', 'no-only-tests'],
}
