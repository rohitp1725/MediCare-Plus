import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, MailCheck } from 'lucide-react'
import { AuthLayout, AuthBrand } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { RoleToggle } from '@/components/ui/RoleToggle'
import { useAuth } from '@/context/AuthContext'
import { signupSchema, type SignupFormValues } from '@/lib/validation/auth'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'patient' },
  })

  async function onSubmit(values: SignupFormValues) {
    setFormError(null)
    const { error, needsEmailConfirmation } = await signUp(values)
    if (error) {
      setFormError(error)
      return
    }
    if (needsEmailConfirmation) {
      setAwaitingConfirmation(true)
      return
    }
    navigate('/', { replace: true })
  }

  if (awaitingConfirmation) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#EAF4F1] text-sage-dark inline-flex items-center justify-center mb-4">
            <MailCheck size={28} />
          </div>
          <h2 className="text-[20px] text-ink mb-2">Check your email</h2>
          <p className="text-sm text-slate-light">
            We sent a confirmation link to finish setting up your account. Once confirmed, sign in to reach your
            dashboard.
          </p>
          <Link to="/login" className="inline-block mt-6">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout maxWidth={480}>
      <AuthBrand />

      <div className="text-center mb-6">
        <h2 className="text-[22px] text-ink">Create Your Account</h2>
        <p className="text-[13px] text-slate-light mt-1">Join MediCare+ to start managing health records</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Controller
          name="role"
          control={control}
          render={({ field }) => <RoleToggle value={field.value} onChange={field.onChange} />}
        />

        <Input
          variant="auth"
          label="👤  Full Name"
          placeholder="Enter your full name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          variant="auth"
          label="✉️  Email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          variant="auth"
          label="📱  Phone (optional)"
          type="tel"
          placeholder="Enter your phone number"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <PasswordInput
          variant="auth"
          label="🔒  Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          variant="auth"
          label="🔒  Confirm Password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {formError && (
          <div className="bg-[#FDECEA] border border-rose-light rounded-sm px-3.5 py-2.5 flex items-center gap-2 text-[13px] text-[#8B2020]">
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
          Create Account
        </Button>
      </form>

      <p className="text-center text-[13px] text-slate-light mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-sage font-semibold hover:text-sage-dark">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
