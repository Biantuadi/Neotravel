'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Demandes',        href: '/dashboard/demandes' },
  { label: 'Devis',           href: '/dashboard/devis' },
  { label: 'Relances',        href: '/dashboard/relances' },
  { label: 'Clients',         href: '/dashboard/clients' },
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-[#4caf50] flex items-center justify-center shrink-0">
        <span className="w-3 h-3 rounded-full bg-white/70" />
      </span>
      <span className="text-white font-bold text-[15px] tracking-tight">Neotravel</span>
    </div>
  )
}

function NavItems({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 mt-2">
      {NAV.map(({ label, href }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} onClick={onClose}
            className={`mx-3 flex items-center h-10 rounded-[10px] text-[13px] font-medium transition-colors relative overflow-hidden
              ${active
                ? 'bg-[rgba(76,175,80,0.15)] text-white font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
            {active && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#4caf50] rounded-r" />}
            <span className={active ? 'pl-5' : 'pl-4'}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Burger mobile (visible < lg) ── */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-[#1a1a1a] rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-lg"
        aria-label="Ouvrir le menu">
        <span className="w-4.5 h-0.5 bg-white rounded-full" />
        <span className="w-4.5 h-0.5 bg-white rounded-full" />
        <span className="w-3 h-0.5 bg-white rounded-full" />
      </button>

      {/* ── Overlay mobile ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar (toujours fixed) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-[220px] shrink-0 bg-[#1a1a1a] min-h-screen flex flex-col pt-6
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 mb-8">
          <Logo />
          <a href="/">
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/40 hover:text-white cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          </a>
        </div>

        <p className="text-[9px] font-semibold text-white/30 px-6 mb-2 tracking-widest uppercase">Pilotage</p>

        <NavItems pathname={pathname} onClose={() => setOpen(false)} />
      </aside>
    </>
  )
}
