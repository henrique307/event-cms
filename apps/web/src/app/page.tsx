import type { HealthResponse } from '@event-cms/types';

// Server Component: busca no servidor, sem expor nada ao navegador.
async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as HealthResponse) : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-10">
      <h1 className="text-3xl font-bold text-brand">Event CMS</h1>
      <p>Fase 1 — monorepo configurado.</p>
      <pre className="rounded bg-neutral-100 p-4 text-sm">
        {health ? JSON.stringify(health, null, 2) : 'API indisponível'}
      </pre>
    </main>
  );
}
