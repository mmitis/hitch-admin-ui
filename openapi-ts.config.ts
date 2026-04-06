import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: (process.env.NEXT_PUBLIC_API_URL ?? 'https://hitch-api-production.up.railway.app') + '/api-json',
  output: { path: 'src/client', format: 'prettier' },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/sdk',
    { name: '@tanstack/react-query' },
  ],
});
