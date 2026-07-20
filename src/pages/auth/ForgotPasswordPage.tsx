import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, MailCheck, ArrowLeft } from 'lucide-react'
import { AuthLayout, AuthBrand } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation/auth'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null)
    const { error } = await requestPasswordReset(values.email)
    if (error) {
      setFormError(error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#EAF4F1] text-sage-dark inline-flex items-center justify-center mb-4">
            <MailCheck size={28} />
          </div>
          <h2 className="text-[20px] text-ink mb-2">Check your email</h2>
          <p className="text-sm text-slate-light">
            If an account exists for that address, we've sent a link to reset your password.
          </p>
          <Link to="/login" className="inline-block mt-6">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthBrand />

      <div className="text-center mb-6">
        <h2 className="text-[22px] text-ink">Reset Your Password</h2>
        <p className="text-[13px] text-slate-light mt-1">Enter your email and we'll send you a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          variant="auth"
          label="👤  Email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
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
          Send Reset Link
        </Button>
      </form>

      <Link to="/login" className="flex items-center justify-center gap-1.5 text-[13px] text-slate-light hover:text-sage mt-6">
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
