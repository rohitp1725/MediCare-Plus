import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function AuthLayout({ children, maxWidth = 460 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-5"
      style={{
        background: 'linear-gradient(135deg, #EAF4F1 0%, var(--color-cream) 30%, var(--color-warm-white) 60%, #F0ECF8 100%)',
      }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <span
          className="absolute rounded-full opacity-[0.12] bg-sage animate-float-shape"
          style={{ width: 400, height: 400, top: -100, right: -100 }}
        />
        <span
          className="absolute rounded-full opacity-[0.12] bg-lavender animate-float-shape"
          style={{ width: 300, height: 300, bottom: -80, left: -80, animationDelay: '-5s' }}
        />
        <span
          className="absolute rounded-full opacity-[0.12] bg-amber animate-float-shape"
          style={{ width: 200, height: 200, top: '50%', left: '10%', animationDelay: '-10s' }}
        />
        <span
          className="absolute rounded-full opacity-[0.12] bg-sage-light animate-float-shape"
          style={{ width: 250, height: 250, bottom: '20%', right: '15%', animationDelay: '-15s' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full"
        style={{ maxWidth }}
      >
        <div className="bg-white/92 backdrop-blur-[20px] rounded-xl border border-white/60 shadow-[0_4px_24px_rgba(28,35,51,0.08),0_16px_56px_rgba(28,35,51,0.12)] px-9 pt-10 pb-8">
          {children}
        </div>
        <div className="text-center mt-5">
          <p className="text-xs text-slate-lighter">© 2026 MediCare+ · Elderly Health Tracker</p>
        </div>
      </motion.div>
    </div>
  )
}

export function AuthBrand() {
  return (
    <div className="text-center mb-7">
      <div className="w-16 h-16 inline-flex items-center justify-center text-[32px] rounded-[20px] mb-3.5 shadow-[0_4px_16px_rgba(74,124,111,0.3)] animate-logo-float bg-[linear-gradient(135deg,var(--color-sage),var(--color-sage-dark))]">
        🏥
      </div>
      <h1 className="text-[30px] text-ink tracking-tight">MediCare+</h1>
      <p className="text-[13px] text-sage-light tracking-wide uppercase font-medium mt-1">Elderly Health Tracker</p>
    </div>
  )
}
