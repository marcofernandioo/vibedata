import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { AuthCard } from './AuthCard'
import * as authApi from '../api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

const signupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const signupMutation = useMutation({
    mutationFn: (values: SignupFormValues) =>
      authApi.signUpWithPassword(values.email, values.password),
    onSuccess: (session) => {
      setSession(session)
      void navigate({ to: '/' })
    },
  })

  const errorMessage =
    signupMutation.error instanceof Error ? signupMutation.error.message : null

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthCard
        title="Create your account"
        subtitle="Sign up with email and password. Google OAuth remains available on the sign-in page."
      >
        <form className="space-y-4" onSubmit={handleSubmit((v) => signupMutation.mutate(v))}>
          <FormField
            id="signup-email"
            type="email"
            label="Email"
            error={errors.email}
            {...register('email')}
          />

          <FormField
            id="signup-password"
            type="password"
            label="Password"
            error={errors.password}
            {...register('password')}
          />

          <FormField
            id="signup-confirm-password"
            type="password"
            label="Confirm password"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button className="w-full" size="lg" type="submit" disabled={signupMutation.isPending}>
            {signupMutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            to="/login"
            search={{ redirect: '/' }}
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}
