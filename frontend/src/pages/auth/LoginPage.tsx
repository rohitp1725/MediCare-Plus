import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { AuthLayout, AuthBrand } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setFormError(error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout>
      <AuthBrand />

      <div className="text-center mb-6">
        <h2 className="text-[22px] text-ink">Welcome Back</h2>
        <p className="text-[13px] text-slate-light mt-1">Sign in to continue managing health records</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-4">
          <Input
            variant="auth"
            label="👤  Email"
            type="email"
            autoComplete="username"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="mb-4">
          <PasswordInput
            variant="auth"
            label="🔒  Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <div className="flex justify-end mb-4">
          <Link to="/forgot-password" className="text-xs text-sage hover:text-sage-dark font-medium">
            Forgot password?
          </Link>
        </div>

        {formError && (
          <div className="bg-[#FDECEA] border border-rose-light rounded-sm px-3.5 py-2.5 flex items-center gap-2 text-[13px] text-[#8B2020] mb-4">
            <AlertTriangle size={16} className="shrink-0" />
            {formError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          className="bg-[linear-gradient(135deg,var(--color-sage),var(--color-sage-dark))] hover:shadow-[0_4px_16px_rgba(74,124,111,0.4)] hover:-translate-y-px rounded-md"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-[13px] text-slate-light mt-6">
        New to MediCare+?{' '}
        <Link to="/signup" className="text-sage font-semibold hover:text-sage-dark">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
