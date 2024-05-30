module.exports = [
  {
    ignores: [
      '**/node_modules/',
      'tmp/',
      'dist/',
      'coverage/',
      'reports/',
      'client/',
      // tmp while we refactor codes
      'Gruntfile.js',
      'mocha.conf.js',
      'server/**/*.js',
      ...require('./eslint.unignore.js'),
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        module: true,
        require: true,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-shadow-restricted-names': 'error',
      'no-shadow': 'error',
      'eqeqeq': ['error', 'smart'],
      'curly': 'error',
      'linebreak-style': ['error', 'unix'],
      'no-console': 'warn',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'object-curly-spacing': ['error', 'always'],
      'sort-imports': [
        'error',
        {
          'ignoreCase': false,
          'ignoreDeclarationSort': false,
          'ignoreMemberSort': false,
          'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
        },
      ],
      'no-unneeded-ternary': [
        'error',
        {
          'defaultAssignment': false,
        },
      ],

      // other rules
      'max-len': ['error', { 'code': 120 }],
      'no-var': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'dot-location': ['error', 'property'],
      'no-else-return': 'error',
      'no-use-before-define': ['error', { 'functions': false }],
      'brace-style': 'error',
      'camelcase': 'warn',
      'comma-spacing': ['error', { 'before': false, 'after': true }],
      'eol-last': 'error',
      'space-before-function-paren': 'error',
      'space-in-parens': 'error',
      'space-before-blocks': 'error',
      'semi-spacing': 'error',
      'no-trailing-spaces': 'error',
      'no-lonely-if': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-multiple-empty-lines': 'error',
      'keyword-spacing': ['error', { 'before': true, 'after': true }],
      'no-spaced-func': 'error',
      'no-param-reassign': 'error',
      'no-redeclare': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'one-var': ['error', 'never'],
      'switch-colon-spacing': 'error',

      // In some cases I have seen it useful to allow undefined assignements
      // 'no-undef-init': 'error',
      // 'no-undefined': 'error',

      // Legacy
      'no-bitwise': 'error',
    },
  },
];
