import { defineConfig } from '@hey-api/openapi-ts';

// Use local openapi.yaml if it exists (for local development), otherwise fetch from the API
const input = process.env.OPENAPI_INPUT
  ?? (process.env.NEXT_PUBLIC_API_URL ?? 'https://hitch-api-production.up.railway.app') + '/api-json';

export default defineConfig({
  input,
  output: { path: 'src/client', format: 'prettier' },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/sdk',
    { name: '@tanstack/react-query' },
  ],
});
