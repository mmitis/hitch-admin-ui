import { createClient } from '@hey-api/client-fetch';

let _apiKey: string | null = null;

export function setApiKey(key: string | null) {
  _apiKey = key;
}

export const apiClient = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
});

// Inject auth header on every request
apiClient.interceptors.request.use((request) => {
  if (_apiKey) {
    request.headers.set('Authorization', `ApiKey ${_apiKey}`);
  }
  return request;
});

// Clear key and redirect on 401
apiClient.interceptors.response.use((response) => {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hitch_api_key');
      setApiKey(null);
      window.location.href = '/login';
    }
  }
  return response;
});
