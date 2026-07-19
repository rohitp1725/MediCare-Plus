import { type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  emoji?: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  children?: ReactNode
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-cream rounded-md p-1 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-all duration-150 ${
            active === tab.id
              ? 'bg-paper text-ink shadow-sm border border-border'
              : 'text-slate-light hover:text-ink hover:bg-paper/60'
          }`}
        >
          {tab.emoji && <span className="text-base">{tab.emoji}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
