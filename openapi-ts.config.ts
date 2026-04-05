import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api-json',
  output: { path: 'src/client', format: 'prettier' },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/sdk',
    { name: '@tanstack/react-query' },
  ],
});
