import tseslint from 'typescript-eslint';
export default [
  { ignores:['node_modules/**','dist/**','.local/**','work/**','main.js','vite.config.*','eslint.config.mjs'] },
  ...tseslint.configs.recommended,
  { files:['src/**/*.{ts,tsx}','server/**/*.ts','packages/**/*.ts','tests/**/*.{ts,tsx}'], rules:{ '@typescript-eslint/no-unused-vars':['error',{ argsIgnorePattern:'^_',varsIgnorePattern:'^_' }] } },
];
