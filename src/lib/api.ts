import { client } from '@/client/client.gen';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

let _apiKey: string | null = null;

function applyConfig() {
  client.setConfig({
    baseUrl: BASE_URL,
    headers: _apiKey ? { Authorization: `ApiKey ${_apiKey}` } : {},
  });
}

export function setApiKey(key: string | null) {
  _apiKey = key;
  applyConfig();
}

applyConfig();

client.interceptors.request.use((request) => {
  if (_apiKey && !request.headers.get('Authorization')) {
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
