---
name: react-vite-zustand
description: Production-grade React + Vite + Zustand architecture skill. Use when building or reviewing frontend applications that need scalable structure, clean API layers, proper state management separation, form handling, data tables, routing, and charts. Covers decision trees, rationale, and annotated code for real SaaS and data-heavy applications.
references:
  - https://github.com/alan2207/bulletproof-react
  - https://github.com/RicardoValdovinos/vite-react-boilerplate
stack:
  - React 18+
  - Vite
  - TypeScript (strict)
  - Zustand
  - TanStack Query (server state)
  - TanStack Router (routing + URL state)
  - TanStack Table (data tables)
  - Axios (HTTP client)
  - Zod (schema validation)
  - React Hook Form (forms)
  - Shadcn/ui + Tailwind CSS (UI system)
  - Recharts (charts)
---

# React + Vite + Zustand Production Skill

## Core Philosophy (Read This First)

Before touching code, internalize these three rules. Every decision in this skill flows from them:

1. **Server state and client state are different things.** TanStack Query owns anything that comes from an API. Zustand owns UI state and cross-cutting client concerns. Never put API data in Zustand. Violating this creates stale data bugs that are hell to debug.

2. **The URL is the most durable state store you have.** It survives refreshes, enables sharing, enables browser history. Anything the user might want to bookmark, share, or return to belongs in the URL — not in memory.

3. **Separation of concerns is not about files, it's about responsibilities.** A file can do one thing well. When a file does three things, none of them are testable, reusable, or readable.

---

## 1. Project Structure

### Rule
Use **feature-based** structure, not type-based. `components/`, `hooks/`, `utils/` at the root is a trap — it scales to ~10 features then becomes a maze. Feature-based means code that changes together lives together.

### Structure
```
src/
├── app/                    # App-level setup only
│   ├── router.tsx          # Route definitions
│   ├── providers.tsx       # QueryClient, ThemeProvider, etc.
│   └── App.tsx
├── components/             # Truly shared, generic UI only
│   ├── ui/                 # Shadcn primitives (Button, Input, etc.)
│   ├── layout/             # Shell, Sidebar, Header
│   └── feedback/           # ErrorBoundary, Spinner, EmptyState
├── features/               # One folder per domain feature
│   └── analytics/
│       ├── api/            # API calls for this feature
│       ├── components/     # Components used only in this feature
│       ├── hooks/          # Hooks used only in this feature
│       ├── stores/         # Zustand slices for this feature
│       ├── types/          # Types/DTOs for this feature
│       └── index.ts        # Public exports only
├── lib/                    # Preconfigured third-party instances
│   ├── axios.ts            # apiClient singleton
│   ├── queryClient.ts      # TanStack Query client config
│   └── router.ts           # TanStack Router instance
├── stores/                 # Global Zustand stores (auth, theme, UI)
├── hooks/                  # Truly shared hooks (useDebounce, useMediaQuery)
├── types/                  # Global shared types
├── utils/                  # Pure utility functions
└── config/                 # Env vars, constants
    └── env.ts
```

### Key Rule — Unidirectional Imports
Code flows one direction: `shared → features → app`. Features cannot import from other features. If two features need the same thing, it belongs in `components/`, `hooks/`, or `utils/`.

Enforce this with ESLint `import/no-restricted-paths`. Reference: bulletproof-react enforces this as a hard lint rule.

### Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts` or `useCamelCase.ts` (pick one, be consistent)
- Everything else: `kebab-case.ts`
- Feature barrel exports: `features/analytics/index.ts` exports only what other features/pages need

---

## 2. API Layer

### Rule
Never write `fetch()` or `axios.get()` directly in a component or hook. Always go through a typed service function. Components do not know URLs exist.

### Why
When your base URL changes, your auth header changes, or you need to add logging — you change one file, not forty.

### Step 1 — API Client Singleton (`lib/axios.ts`)
```typescript
import axios, { AxiosError } from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Attach auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') // or from Zustand auth store
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors + handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Attempt token refresh or redirect to login
      useAuthStore.getState().logout()
    }
    // Normalize to a consistent error shape
    return Promise.reject(normalizeError(error))
  }
)
```

### Step 2 — DTOs (Types First)
Define request and response shapes before writing any service function. DTOs live in `features/<name>/types/`.

```typescript
// features/analytics/types/revenue.types.ts

// What the API returns (matches backend schema exactly)
export interface RevenueResponse {
  data: RevenueRecord[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export interface RevenueRecord {
  id: string
  date: string       // ISO string from API
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
}

// What you send to the API
export interface RevenueQueryParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: RevenueRecord['status']
  dateFrom?: string
  dateTo?: string
}
```

### Step 3 — Service Functions
```typescript
// features/analytics/api/revenue.api.ts
import { apiClient } from '@/lib/axios'
import type { RevenueQueryParams, RevenueResponse } from '../types/revenue.types'

export const revenueApi = {
  getAll: (params: RevenueQueryParams) =>
    apiClient.get<RevenueResponse>('/revenue', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<RevenueRecord>(`/revenue/${id}`).then((r) => r.data),

  export: (params: Omit<RevenueQueryParams, 'page' | 'pageSize'>) =>
    apiClient.get('/revenue/export', { params, responseType: 'blob' }).then((r) => r.data),
}
```

### HTTP Status — As Error vs As Data
**Decision rule:**
- 2xx → always data, never check status manually
- 4xx client errors (400, 422) → throw, catch in form error handler, map to field errors
- 401 → handle globally in interceptor (logout/refresh)
- 403 → throw, show permission error UI
- 5xx → throw, show generic error, log to Sentry

Never do `if (response.status === 200)` — Axios already throws on non-2xx.

### Error Normalization
```typescript
// utils/error.ts
export interface ApiError {
  message: string
  code?: string
  fieldErrors?: Record<string, string[]> // for form validation errors from server
}

export function normalizeError(error: AxiosError<ApiError>): ApiError {
  return {
    message: error.response?.data?.message ?? error.message ?? 'Something went wrong',
    code: error.response?.data?.code,
    fieldErrors: error.response?.data?.fieldErrors,
  }
}
```

---

## 3. Server State vs Client State

### The Hard Line
| What | Who Owns It | Why |
|------|-------------|-----|
| API data (lists, records) | TanStack Query | Caching, refetching, deduplication |
| API mutation state (loading, error) | TanStack Query | useMutation handles this |
| Currently selected table rows | Zustand or local state | Pure UI, no server dependency |
| Modal open/closed | URL param or local state | Depends on shareability requirement |
| Auth token + user session | Zustand (persisted) | Cross-cutting, survives navigation |
| Theme, sidebar collapsed | Zustand (persisted) | Cross-cutting UI preferences |
| Form field values | React Hook Form | Isolated, performant |
| Search/filter params driving a query | URL search params | Shareable, bookmarkable |

### TanStack Query Setup (`lib/queryClient.ts`)
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 min — don't refetch if data is fresh
      retry: 1,                      // Retry failed requests once
      refetchOnWindowFocus: false,   // Disable for data-heavy dashboards
    },
  },
})
```

### Query Key Convention
Use factory functions for query keys — never raw strings. This makes cache invalidation deterministic.

```typescript
// features/analytics/api/revenue.keys.ts
export const revenueKeys = {
  all: ['revenue'] as const,
  lists: () => [...revenueKeys.all, 'list'] as const,
  list: (params: RevenueQueryParams) => [...revenueKeys.lists(), params] as const,
  detail: (id: string) => [...revenueKeys.all, 'detail', id] as const,
}

// Usage: queryClient.invalidateQueries({ queryKey: revenueKeys.lists() })
// This invalidates ALL list queries regardless of their params
```

---

## 4. Zustand Patterns

### Store Design
One store per domain concern. Not one global store.

```typescript
// stores/auth.store.ts
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  // Actions co-located with state — not in a separate actions file
  setUser: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        setUser: (user, token) => set({ user, token }),
        logout: () => set({ user: null, token: null }),
      }),
      { name: 'auth-storage' } // persists to localStorage under this key
    ),
    { name: 'AuthStore' }
  )
)
```

### Selectors — Prevent Re-renders
```typescript
// BAD — component re-renders on ANY store change
const { user, token, logout } = useAuthStore()

// GOOD — component only re-renders when user.name changes
const userName = useAuthStore((s) => s.user?.name)
const logout = useAuthStore((s) => s.logout)
```

### What Should Never Go in Zustand
- API response data (use TanStack Query)
- Form state (use React Hook Form)
- State that only one component uses (use local useState)
- Derived data that can be computed from existing state (compute it inline)

---

## 5. Hooks Design

### The Decision Tree
```
Do I need to fetch/mutate server data?
  → YES: useQuery / useMutation (TanStack Query)
  → NO: Continue below

Is this state shared across multiple components?
  → YES: Is it UI/preference state?
       → YES: Zustand
       → NO: Is it server data? → useQuery
  → NO: Continue below

Is this state local to one component?
  → YES: Does it have complex transitions (multiple sub-states)?
       → YES: useReducer
       → NO: useState
```

### Why Most useEffect Usage Is Wrong
`useEffect` was designed to sync React with external systems (DOM APIs, WebSockets, subscriptions). It was not designed for:

```typescript
// ❌ This is wrong — race condition, no caching, runs on every mount
useEffect(() => {
  setLoading(true)
  fetchRevenue(params)
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false))
}, [params])

// ✅ This is correct — cached, deduped, handles loading/error automatically
const { data, isLoading, error } = useQuery({
  queryKey: revenueKeys.list(params),
  queryFn: () => revenueApi.getAll(params),
})
```

### Legitimate useEffect Uses
```typescript
// ✅ Syncing with a non-React system
useEffect(() => {
  const subscription = websocket.subscribe(handleMessage)
  return () => subscription.unsubscribe()
}, [])

// ✅ Updating document title
useEffect(() => {
  document.title = `${user.name} | Dashboard`
}, [user.name])

// ✅ Triggering imperative DOM behavior
useEffect(() => {
  if (isOpen) inputRef.current?.focus()
}, [isOpen])
```

### Custom Hook Pattern — One Hook Per Feature Behavior
```typescript
// features/analytics/hooks/use-revenue-table.ts
// This hook encapsulates ALL behavior for the revenue table
// The component becomes a pure renderer

export function useRevenueTable() {
  // 1. URL params own the query state
  const [searchParams, setSearchParams] = useSearchParams()

  const params: RevenueQueryParams = {
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Number(searchParams.get('pageSize') ?? 20),
    sortBy: searchParams.get('sortBy') ?? 'date',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') as RevenueRecord['status'] ?? undefined,
  }

  // 2. Query owns the server data
  const { data, isLoading, error } = useQuery({
    queryKey: revenueKeys.list(params),
    queryFn: () => revenueApi.getAll(params),
    placeholderData: keepPreviousData, // prevents loading flash on page change
  })

  // 3. Param updaters — clean, typed
  const setPage = (page: number) =>
    setSearchParams((prev) => { prev.set('page', String(page)); return prev })

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc') =>
    setSearchParams((prev) => {
      prev.set('sortBy', sortBy)
      prev.set('sortOrder', sortOrder)
      prev.set('page', '1') // reset to page 1 on sort change
      return prev
    })

  const setSearch = (search: string) =>
    setSearchParams((prev) => {
      if (search) prev.set('search', search)
      else prev.delete('search')
      prev.set('page', '1')
      return prev
    })

  return { data, isLoading, error, params, setPage, setSort, setSearch }
}
```

---

## 6. Navigation & Routing

### Router Setup — TanStack Router (Preferred over React Router)
TanStack Router has first-class typed search params. This is what makes URL-as-state clean. React Router v6 works too but requires more manual wiring.

```typescript
// app/router.tsx
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'

const rootRoute = createRootRoute({ component: RootLayout })

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
  validateSearch: (search) => revenueSearchSchema.parse(search), // Zod validates URL params
})
```

### URL as State — The Decision Rule
**Put it in the URL if ANY of these are true:**
- The user might share this view with someone else
- The user might bookmark it and return
- The browser back button should restore it
- It drives a server query (filters, pagination, sort)

**Keep it in local state or Zustand if ALL of these are true:**
- It's purely ephemeral UI (tooltip open, dropdown open)
- It has no meaning outside the current session
- It would pollute the URL with noise

### Modal Routing Patterns

**Pattern A — State-driven modal (simple, non-shareable)**
```typescript
// Use when: modal is purely UI, content doesn't need to be deep-linked
const [selectedRow, setSelectedRow] = useState<RevenueRecord | null>(null)

// Pass data down as prop — no extra API call needed
<RevenueDetailModal
  record={selectedRow}
  onClose={() => setSelectedRow(null)}
/>
```

**Pattern B — URL-driven modal (shareable, deep-linkable)**
```typescript
// Use when: modal content should be shareable or survive refresh
// URL becomes: /analytics?modal=detail&id=abc123

const searchParams = useSearchParams()
const modalId = searchParams.get('id')
const isOpen = searchParams.get('modal') === 'detail' && !!modalId

// Child fetches its own data — it's now an independent entity
function RevenueDetailModal({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: revenueKeys.detail(id),
    queryFn: () => revenueApi.getById(id),
    enabled: !!id, // only fetch when id exists
  })
  // ...
}
```

**Decision rule:**
- Internal admin dashboard row detail → Pattern A (nobody is sharing URLs)
- Customer-facing SaaS where support might share a link → Pattern B

### Scaling a Modal to a Flow
If a modal grows into a multi-step flow (modal → another modal → confirmation), convert it to a dedicated route with nested sub-routes. Do not stack modals-in-modals with state. That becomes unnavigable.

```
/orders/:id          → Order detail page
/orders/:id/refund   → Refund flow (nested route, not a modal)
/orders/:id/dispute  → Dispute flow (nested route)
```

### Protected Routes
```typescript
// components/layout/AuthGuard.tsx
export function AuthGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />
  }

  return <>{children}</>
}
```

---

## 7. Forms

### Stack
`react-hook-form` + `zod`. No exceptions for production forms.

### Why Not useState for Forms
- Each keystroke triggers a re-render of the whole component
- Validation logic is scattered — field-level, submit-level, all ad-hoc
- No standardized error mapping from API responses back to fields
- Double-submission is not handled

### Schema-Driven Validation
Define the schema first. It becomes the source of truth for both TypeScript types and runtime validation.

```typescript
// features/settings/types/profile.schema.ts
import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
  timezone: z.string().min(1, 'Timezone is required'),
})

export type ProfileFormData = z.infer<typeof profileSchema>
// TypeScript type is derived from the schema — never written manually
```

### Form Implementation
```typescript
// features/settings/components/ProfileForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormData }) {
  const { mutate, isPending } = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: profileKeys.me() })
    },
    onError: (error: ApiError) => {
      // Map server field errors back to form fields
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof ProfileFormData, {
            message: messages[0],
          })
        })
      } else {
        toast.error(error.message)
      }
    },
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  // onSubmit only fires if ALL zod validation passes
  const onSubmit = (data: ProfileFormData) => mutate(data)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* handleSubmit prevents double-submission, handles enter key */}

      <Input
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
      <Input
        {...form.register('email')}
        error={form.formState.errors.email?.message}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
```

### Debouncing — Search Inputs Only
Debouncing is for **search inputs that drive API calls**, not for form submission. Never debounce a form submit button.

```typescript
// hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer) // cleanup on each change
  }, [value, delay])

  return debounced
}

// Usage in a search component
const [input, setInput] = useState('')
const debouncedSearch = useDebounce(input, 400)

// Query only fires after user stops typing for 400ms
const { data } = useQuery({
  queryKey: revenueKeys.list({ ...params, search: debouncedSearch }),
  queryFn: () => revenueApi.getAll({ ...params, search: debouncedSearch }),
  enabled: debouncedSearch.length > 2 || debouncedSearch.length === 0,
})
```

---

## 8. Data Tables

### The Three Separated Concerns

**Concern 1 — URL Params State** (what the user has selected)
Lives in the URL. Managed by the custom hook.

**Concern 2 — API Call** (fetching data based on params)
One `useQuery` call. Returns `data`, `isLoading`, `error`.

**Concern 3 — Table Config** (how data is displayed and interacted with)
Column definitions, cell renderers, row actions. Static config — does not change based on data.

### Column Definitions
```typescript
// features/analytics/components/revenue-table/columns.tsx
// This file ONLY defines how columns look and behave
// It does not fetch data, it does not manage state

import { createColumnHelper } from '@tanstack/react-table'
import type { RevenueRecord } from '../../types/revenue.types'

const col = createColumnHelper<RevenueRecord>()

export const revenueColumns = [
  col.accessor('date', {
    header: 'Date',
    cell: (info) => formatDate(info.getValue()),
    enableSorting: true,
  }),
  col.accessor('amount', {
    header: 'Amount',
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency),
    enableSorting: true,
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
    enableSorting: false,
  }),
  col.display({
    id: 'actions',
    cell: (info) => <RevenueRowActions record={info.row.original} />,
  }),
]
```

### Table Component — Pure Renderer
```typescript
// features/analytics/components/RevenueTable.tsx
// This component ONLY renders. All logic lives in the hook.

export function RevenueTable() {
  const { data, isLoading, error, params, setPage, setSort, setSearch } =
    useRevenueTable()

  const table = useReactTable({
    data: data?.data ?? [],
    columns: revenueColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,    // server handles pagination
    manualSorting: true,       // server handles sorting
    pageCount: data ? Math.ceil(data.meta.total / params.pageSize) : -1,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater([]) : updater
      if (next[0]) setSort(next[0].id, next[0].desc ? 'desc' : 'asc')
    },
  })

  if (isLoading) return <TableSkeleton columns={5} rows={10} />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <SearchInput onSearch={setSearch} defaultValue={params.search} />
      <Table table={table} />
      <Pagination
        page={params.page}
        pageSize={params.pageSize}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  )
}
```

### Server-Side vs Client-Side — Decision Rule
- **< 500 rows total, rarely changes** → client-side (load all, filter in memory with TanStack Table)
- **> 500 rows OR unknown growth** → server-side always. Never assume the dataset stays small.

---

## 9. Charts & Graphs

### Library Decision Tree
| Need | Library | Why |
|------|---------|-----|
| Standard charts (line, bar, pie) with easy theming | **Recharts** | Composable, React-native, small bundle |
| Complex custom visualizations | **Nivo** | More chart types, better defaults |
| Large datasets (10k+ points), performance critical | **ECharts** | Canvas-based, handles volume |
| Simple sparklines/trends | **Recharts** (ResponsiveContainer) | Overkill to bring in another lib |

### Recharts Pattern
```typescript
// features/analytics/components/RevenueChart.tsx

export function RevenueChart() {
  const { data, isLoading } = useQuery({
    queryKey: revenueKeys.list({ page: 1, pageSize: 30, sortBy: 'date', sortOrder: 'asc' }),
    queryFn: () => revenueApi.getAll({ page: 1, pageSize: 30, sortBy: 'date', sortOrder: 'asc' }),
  })

  // Transform API data to chart format HERE, not in the chart component
  const chartData = useMemo(() =>
    data?.data.map((r) => ({
      date: formatDate(r.date, 'MMM d'),
      revenue: r.amount,
    })) ?? [],
  [data])

  if (isLoading) return <ChartSkeleton />
  if (!chartData.length) return <EmptyChart message="No revenue data for this period" />

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)' }} />
        <YAxis tickFormatter={formatCurrencyShort} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary)"   {/* CSS variables, not hardcoded hex */}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Rules
- Always use CSS variables for chart colors (`var(--color-primary)`) — never hardcode hex values. This ensures dark mode and theme changes apply automatically.
- Always handle loading, empty, and error states explicitly before rendering the chart.
- Transform data in a `useMemo` above the return statement — never inline inside JSX.
- Always wrap in `ResponsiveContainer` — never hardcode pixel widths.

---

## 10. UI/UX System

### Stack
Shadcn/ui + Tailwind CSS. Shadcn is not a package — it's code you own, living in `components/ui/`. You can modify every component. This is the key advantage over MUI or Ant Design.

### Design Tokens
Every color, radius, and shadow is a CSS variable. Never use raw Tailwind color values (`blue-500`) directly — always map through your token system.

```css
/* Defined in globals.css */
:root {
  --color-primary: 221 83% 53%;
  --color-primary-foreground: 0 0% 100%;
  --color-destructive: 0 72% 51%;
  --color-muted: 210 40% 96%;
  --color-muted-foreground: 215 16% 47%;
  --color-border: 214 32% 91%;
  --radius: 0.5rem;
}

.dark {
  --color-primary: 217 91% 60%;
  --color-muted: 217 32% 17%;
  /* etc. */
}
```

### Component Variants with CVA
```typescript
// components/ui/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

// Usage: <Badge variant="success">Paid</Badge>
```

### Responsiveness
Mobile-first. Default styles target mobile, breakpoints add complexity.
```tsx
// ✅ Mobile-first
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">

// ❌ Desktop-first (fights the cascade)
<div className="flex flex-row gap-8 sm:flex-col sm:gap-4">
```

---

## 11. Error Handling & Resilience

### Error Boundaries
Place one at the route level (catches any component crash in that route) and optionally one around individual dashboard widgets so one broken chart doesn't kill the whole page.

```typescript
// components/feedback/ErrorBoundary.tsx
// Use react-error-boundary package — don't write this from scratch

import { ErrorBoundary } from 'react-error-boundary'

function WidgetErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm text-muted-foreground">Failed to load this widget</p>
      <Button variant="ghost" size="sm" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  )
}

// Wrap individual dashboard widgets
<ErrorBoundary FallbackComponent={WidgetErrorFallback}>
  <RevenueChart />
</ErrorBoundary>
```

### Toast Notifications
Use `sonner` or `react-hot-toast`. Call toasts from mutation callbacks, not from components.
```typescript
onSuccess: () => toast.success('Saved successfully'),
onError: (e: ApiError) => toast.error(e.message),
```

### Empty States
Never show a blank area. Every list, table, and chart needs an explicit empty state.
```typescript
if (!data?.data.length) {
  return (
    <EmptyState
      icon={<BarChart2 />}
      title="No revenue data"
      description="Revenue will appear here once transactions are recorded."
      action={<Button>Learn more</Button>}
    />
  )
}
```

---

## 12. Auth & Session Management

### Token Storage — The Honest Tradeoff
| Approach | XSS Risk | CSRF Risk | Refresh UX |
|----------|----------|-----------|------------|
| localStorage | High | None | Easy |
| httpOnly cookie | None | Moderate (needs CSRF token) | Transparent |
| Memory only | None | None | Lost on refresh |

For most SaaS apps: httpOnly cookie is the correct answer, but requires backend coordination. If your backend doesn't support it, localStorage with short-lived tokens + refresh rotation is acceptable.

### Refresh Token Flow
```typescript
// In apiClient interceptors (lib/axios.ts)
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

apiClient.interceptors.response.use(null, async (error: AxiosError) => {
  const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      // Queue requests while refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { token } = await authApi.refresh()
      useAuthStore.getState().setToken(token)
      failedQueue.forEach((p) => p.resolve(token))
      return apiClient(originalRequest)
    } catch {
      failedQueue.forEach((p) => p.reject())
      useAuthStore.getState().logout()
    } finally {
      isRefreshing = false
      failedQueue = []
    }
  }

  return Promise.reject(error)
})
```

---

## 13. Performance Patterns

### The Real Rule
Don't optimize until you have a measured problem. Premature optimization is the most common source of complexity in React codebases. Profile first with React DevTools.

### When Memoization Actually Helps
```typescript
// useMemo: expensive computation, stable inputs
const chartData = useMemo(() => transformRevenueData(rawData), [rawData])
// NOT for: simple maps, filters, or anything that runs in <1ms

// useCallback: function passed to a memoized child component
const handleRowClick = useCallback((row: RevenueRecord) => {
  navigate({ search: { modal: 'detail', id: row.id } })
}, [navigate])
// NOT for: every function in every component

// React.memo: component that re-renders with same props frequently
export const RevenueChart = React.memo(function RevenueChart({ data }) {
  // ...
})
// NOT for: components that always get new props anyway
```

### Code Splitting
```typescript
// app/router.tsx — lazy load feature pages
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
```

---

## 14. Environment & Config

```typescript
// config/env.ts — centralize ALL env access here
// Never call import.meta.env.VITE_* directly in components

const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  appName: import.meta.env.VITE_APP_NAME ?? 'App',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

// Validate at startup — fail loudly if required vars are missing
if (!env.apiBaseUrl) throw new Error('VITE_API_BASE_URL is not set')

export { env }
```

`.env` files:
```
.env                  # Defaults, committed
.env.local            # Local overrides, gitignored
.env.staging          # Staging values, committed
.env.production       # Production values, committed (no secrets)
```

---

## 15. Dev Tooling & Conventions

### Absolute Imports (`vite.config.ts`)
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### TypeScript — Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,  // array[0] is T | undefined, forces null checks
    "noImplicitReturns": true
  }
}
```

### ESLint Rules That Matter
```json
{
  "rules": {
    "import/no-restricted-paths": [...], // enforce feature isolation
    "react-hooks/exhaustive-deps": "error", // catch missing useEffect deps
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Pre-commit (Husky + lint-staged)
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

This runs linting and formatting on every commit. No broken code or inconsistent style reaches the repo.