'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader } from '@heroui/react';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/contest/list',
        { headers: { Authorization: `ApiKey ${trimmed}` } },
      );
      if (!res.ok) {
        setError('Invalid API key. Please try again.');
        return;
      }
      login(trimmed);
      router.push('/management');
    } catch {
      setError('Connection error. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="flex flex-col items-start gap-1 px-6 pt-6 pb-2">
          <h1 className="text-xl font-bold">HitchHikersMate</h1>
          <p className="text-sm text-zinc-500">Admin — enter your API key to continue</p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="api-key" className="text-sm font-medium">
                API Key
              </label>
              <input
                id="api-key"
                type="password"
                placeholder="Enter API key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              variant="primary"
              isDisabled={loading}
              fullWidth
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
