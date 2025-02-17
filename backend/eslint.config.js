// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Recommended base configuration
  js.configs.recommended,
  
  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      },
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    
    // Customizable rules
    rules: {
      // Error prevention
      'no-unused-vars': ['warn', { 
        vars: 'all', 
        args: 'after-used', 
        ignoreRestSiblings: false 
      }],
      'no-console': 'off',
      'no-undef': 'error',
      
      // Strict code style
      'indent': ['error', 2, { 
        'SwitchCase': 1,
        'VariableDeclarator': 'first',
        'MemberExpression': 1,
        'FunctionDeclaration': { 'parameters': 'first' },
        'CallExpression': { 'arguments': 'first' }
      }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
      
      // Additional style guidelines
      'max-len': ['warn', { 
        'code': 120, 
        'tabWidth': 2, 
        'ignoreComments': true,
        'ignoreUrls': true 
      }],
      'no-multiple-empty-lines': ['error', { 'max': 2 }],
      'eol-last': ['error', 'always']
    }
  }
];
