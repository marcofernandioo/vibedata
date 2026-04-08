import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { RouteErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { AuthCallback } from '@/features/auth/components/AuthCallback'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { SignupPage } from '@/features/auth/components/SignupPage'
import { DashboardShell, DashboardHomePage } from '@/features/dashboard'
import { AnalyticsPage } from '@/features/analytics'
import { useAuthStore } from '@/stores/auth.store'

function RootLayout() {
  return (
    <RouteErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    </RouteErrorBoundary>
  )
}

function ProtectedLayout() {
  return (
    <AuthGuard>
      <DashboardShell>
        <Outlet />
      </DashboardShell>
    </AuthGuard>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
  component: LoginPage,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
})

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallback,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  path: '/',
  component: ProtectedLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardHomePage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  authCallbackRoute,
  protectedRoute.addChildren([dashboardRoute, analyticsRoute]),
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouter() {
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        Loading application...
      </div>
    )
  }

  return <RouterProvider router={router} />
}
