import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { AuthLayout, AuthBrand } from '@/components/layout/AuthLayout'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation/auth'

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null)
    const { error } = await updatePassword(values.password)
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
        <h2 className="text-[22px] text-ink">Set a New Password</h2>
        <p className="text-[13px] text-slate-light mt-1">Choose a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordInput
          variant="auth"
          label="🔒  New Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          variant="auth"
          label="🔒  Confirm Password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
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
          Update Password
        </Button>
      </form>
    </AuthLayout>
  )
}
