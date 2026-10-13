# Arquitetura — Event CMS

## Visão geral
```text
Navegador ──> apps/web (Next.js, App Router)
                 │  SSR / Server Components (site público)
                 │  Client Components (painel)
                 ▼  REST + JWT
              apps/api (NestJS) ──Prisma──> PostgreSQL
                 │
                 └──> Storage S3 compatível (imagens, Fase 5)
```

## Monorepo
| Pasta | Responsabilidade |
|---|---|
| `apps/web` | Site público multi-tenant + painel `/painel` |
| `apps/api` | Regras de negócio, autenticação, autorização |
| `packages/database` | `schema.prisma`, migrations, seed, client gerado |
| `packages/types` | Contratos HTTP compartilhados (sem lógica) |
| `packages/config` | tsconfig e ESLint compartilhados |

## Decisões em relação à proposta original
1. **`prisma/` na raiz → `packages/database`.** Na raiz o schema não pertence a nenhum
   workspace: o Turborepo não sabe quando rodar `prisma generate`, e o client fica
   acoplado ao `node_modules` raiz. Como pacote, ele tem dependências e scripts próprios.
2. **Sem `packages/ui` por enquanto.** O shadcn/ui copia componentes para dentro do app e
   só o `web` os usa. Um pacote compartilhado seria abstração sem consumidor. Pode ser
   extraído se surgir um segundo app.
3. **Só a API acessa o banco.** O Next nunca importa `@event-cms/database`; assim toda
   regra de permissão/isolamento entre eventos fica num único lugar (backend).
4. **`packages/types` não exporta tipos do Prisma.** Evita vazar o modelo de banco para o
   frontend e permite mudar o schema sem quebrar contratos públicos.

## Multi-tenancy (planejado — Fases 3/4)
- Modelo de banco compartilhado com coluna `eventId` em todas as tabelas do tenant.
- `middleware.ts` do Next lê o `Host`, extrai o subdomínio e reescreve para
  `/_sites/[slug]/...` internamente. Funciona em qualquer host que repasse o header `Host`.
- A API valida em todo endpoint se o usuário é membro do evento (`EventMember`).

## Ambientes
- Local: `docker compose` sobe o PostgreSQL; apps rodam com `pnpm dev`.
- Subdomínios locais: `*.localhost` resolve para 127.0.0.1 nos navegadores modernos
  (ex.: `meu-evento.localhost:3000`).
