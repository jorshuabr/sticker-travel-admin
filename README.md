# sticker-travel-admin

Panel de administración web para **sticker-travel-app**: cola de moderación, gestión de usuarios restringidos y estadísticas básicas. Repositorio gemelo del de la app mobile (`sticker-travel-app`), conectado al mismo proyecto Supabase.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (componentes con Radix subyacente)
- **@supabase/ssr** + **@supabase/supabase-js** para auth y queries
- **Deploy**: Cloudflare Pages (free tier)

## Setup local

```bash
cp .env.example .env.local
# Rellenar NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY
# (los valores los imprime `npx supabase status` desde el repo sticker-travel-app)

npm install
npm run dev   # http://localhost:3000
```

## Convenciones

- **Auth gate**: solo usuarios con rol `moderator` pueden acceder.
- **No exponer service_role al cliente**: usar solo en route handlers o server actions.
- **Git workflow**: feature branches + PRs, igual que en el repo de la app mobile.
- **Idioma del UI**: español como primario.

## Estructura

```
app/                # rutas Next.js App Router
  page.tsx          # landing actual (placeholder)
components/ui/      # shadcn/ui components
lib/                # helpers, Supabase clients, etc.
```

## Roadmap

- [x] F1 Bootstrap Next.js + TS + Tailwind + shadcn/ui
- [ ] F2 Supabase client + auth + admin gate
- [ ] F3 Cola de moderación (flagged + botones aprobar/rechazar/IA)
- [ ] F4 Restricted users (lista + restrict/unrestrict)
- [ ] F5 Stats básicos (KPIs + charts)
- [ ] F6 Deploy Cloudflare Pages

## Relación con sticker-travel-app

| | sticker-travel-app | sticker-travel-admin |
|---|---|---|
| Plataforma | Android (iOS futuro) | Web |
| Stack | Flutter + Dart | Next.js + TypeScript |
| Repo | jorshuabr/sticker-travel-app | jorshuabr/sticker-travel-admin |
| Audiencia | Usuarios finales (viajeros) | Moderadores |
| DB | Mismo Supabase project | Mismo Supabase project |
| Auth | Sign in con email/Apple/Google | Email + role `moderator` |
