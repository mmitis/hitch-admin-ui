import { client } from '@/client/client.gen';

let _apiKey: string | null = null;

export function setApiKey(key: string | null) {
  _apiKey = key;
}

client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
});

client.interceptors.request.use((request) => {
  if (_apiKey) {
    request.headers.set('Authorization', `ApiKey ${_apiKey}`);
  }
  return request;
});

client.interceptors.response.use((response) => {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hitch_api_key');
      setApiKey(null);
      window.location.href = '/login';
    }
  }
  return response;
});

export { client as apiClient };
