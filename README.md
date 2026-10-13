# Event CMS

CMS SaaS multi-tenant para websites de eventos. Cada evento ganha um site público
(`slug.eventhub.com`) e um painel (`slug.eventhub.com/painel`).

> Status: **Fase 2** — schema do banco, migrations, seed, usuários e autenticação JWT.

## Tecnologias
pnpm · Turborepo · Next.js 15 (App Router) · NestJS 10 · Prisma 5 · PostgreSQL 16 ·
Tailwind CSS 4 · TypeScript · ESLint 9 · Prettier · Jest

## Estrutura
```text
event-cms/
├── apps/
│   ├── web/            Next.js (site público + painel)
│   └── api/            NestJS (REST)
├── packages/
│   ├── database/       Prisma schema, migrations, seed
│   ├── types/          Contratos HTTP compartilhados
│   └── config/         tsconfig + ESLint
├── docs/architecture.md
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```
Detalhes e justificativas: [docs/architecture.md](docs/architecture.md).

## Pré-requisitos
Node 20+, pnpm 9 (`corepack enable`), Docker.

## Início rápido
```bash
pnpm install
cp .env.example .env
cp packages/database/.env.example packages/database/.env   # Prisma CLI lê daqui
pnpm db:up            # sobe o PostgreSQL
pnpm db:migrate -- --name init   # cria as tabelas e gera o Prisma Client
pnpm db:seed          # usuário demo + evento "festival-demo"
pnpm dev              # web em :3000, api em :3333
```
Verifique:
- http://localhost:3333/health → `{ "status": "ok", "database": "up" }`
- http://localhost:3000 → mostra o status da API

## Scripts
| Comando | Ação |
|---|---|
| `pnpm dev` | Roda todos os apps em modo watch |
| `pnpm build` | Build de todos os pacotes |
| `pnpm lint` / `pnpm typecheck` | Qualidade |
| `pnpm test` | Testes |
| `pnpm db:migrate` | Cria/aplica migrations |
| `pnpm db:seed` | Popula dados fictícios |
| `pnpm db:reset` | Apaga o banco, reaplica migrations e roda o seed |
| `pnpm db:studio` | Prisma Studio |

## Variáveis de ambiente
Ver `.env.example`. Apenas variáveis `NEXT_PUBLIC_*` chegam ao navegador —
nunca coloque secrets com esse prefixo.

## Subdomínios em desenvolvimento
Navegadores modernos resolvem `*.localhost` para 127.0.0.1, então
`meu-evento.localhost:3000` funciona sem editar `/etc/hosts` (implementado na Fase 4).

## Banco de dados
Schema em `packages/database/prisma/schema.prisma`. Entidades: User, Event, EventMember,
EventSettings, Section, Ticket, Media, SEOSettings, RefreshToken, PasswordResetToken.
Todo conteúdo tem `eventId` (multi-tenant); IDs em UUID; `Event.slug` é único.

Login do seed: `owner@eventhub.local` / `Senha@12345`.

## Autenticação (API)
| Método | Rota | Corpo | Auth |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | — |
| POST | `/auth/login` | `{ email, password }` | — |
| POST | `/auth/refresh` | `{ refreshToken }` | — |
| POST | `/auth/logout` | `{ refreshToken }` | — |
| GET | `/users/me` | — | `Bearer <accessToken>` |

- Access token: 15 min. Refresh token: 7 dias, com rotação a cada uso.
- Toda rota exige JWT por padrão; rotas abertas usam `@Public()`.
- Rotas `/auth/*`: 10 req/min por IP. Demais: 100 req/min.

## Próximas seções (fases seguintes)
Banco/Migrations/Seed, Autenticação, Deploy e Testes serão documentados conforme forem implementados.
