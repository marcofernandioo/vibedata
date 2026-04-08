import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { AuthCard } from './AuthCard'
import * as authApi from '../api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const redirectTo =
    typeof search.redirect === 'string' && search.redirect.length > 0
      ? search.redirect
      : '/'

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      authApi.signInWithPassword(values.email, values.password),
    onSuccess: (session) => {
      setSession(session)
      void navigate({ to: redirectTo })
    },
  })

  const googleMutation = useMutation({
    mutationFn: () => authApi.signInWithGoogle(),
  })

  const errorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : googleMutation.error instanceof Error
        ? googleMutation.error.message
        : null

  const isPending = loginMutation.isPending || googleMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthCard
        title="Sign in to Vibedata"
        subtitle="Use Google OAuth or your email and password to continue."
      >
        <div className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => googleMutation.mutate()}
            disabled={isPending}
          >
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or use email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit((v) => loginMutation.mutate(v))}>
            <FormField
              id="email"
              type="email"
              label="Email"
              error={errors.email}
              {...register('email')}
            />

            <FormField
              id="password"
              type="password"
              label="Password"
              error={errors.password}
              {...register('password')}
            />

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            <Button className="w-full" size="lg" type="submit" disabled={isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Need an account?{' '}
            <Link className="font-medium text-foreground underline underline-offset-4" to="/signup">
              Create one
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  )
}
