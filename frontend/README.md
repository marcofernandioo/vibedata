# Vibedata Frontend

React + TypeScript + Vite frontend with Supabase OAuth and NestJS API integration.

## Features

- **Authentication**: Google OAuth + email/password via Supabase, persisted with Zustand
- **Protected routes**: `AuthGuard` component with redirect-to-login
- **State management**: Zustand (auth store with devtools + persist middleware)
- **Server state**: TanStack React Query with 5-minute stale time
- **Routing**: TanStack Router with type-safe routes
- **Forms**: react-hook-form + zod schema validation
- **UI**: Tailwind CSS + shadcn components (base-nova style)

## Project Structure

```
src/
├── main.tsx                         # React root
├── App.tsx                          # Providers + Router composition
├── index.css                        # Tailwind directives, CSS variables, theme
├── config/                          # Environment variable validation
├── lib/                             # Supabase client, Axios client, React Query, utils
├── stores/                          # Zustand auth store
├── app/
│   ├── providers.tsx                # QueryClientProvider, ErrorBoundary, auth init
│   └── router.tsx                   # Route tree, protected layout, loading state
├── components/
│   ├── ui/                          # shadcn primitives (Button, FormField)
│   ├── layout/                      # AuthGuard, NavLink
│   └── feedback/                    # ErrorBoundary (app + route level)
└── features/
    ├── auth/                        # Login, Signup, AuthCallback, auth API, types
    ├── dashboard/                   # DashboardShell, DashboardHomePage
    └── analytics/                   # AnalyticsPage (placeholder)
```

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values:

   ```
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   VITE_API_BASE_URL="http://localhost:3000"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
