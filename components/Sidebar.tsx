'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Demandes',        href: '/dashboard/demandes' },
  { label: 'Devis',           href: '/dashboard/devis' },
  { label: 'Relances',        href: '/dashboard/relances' },
  { label: 'Clients',         href: '/dashboard/clients' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-[200px] shrink-0 bg-[#1a1a1a] min-h-screen flex-col pt-6">
      <div className="flex items-center gap-3 px-6 mb-8">
        <span className="w-6 h-6 rounded-full bg-[#4caf50] flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#a5d6a7]" />
        </span>
        <span className="text-white font-bold text-[15px]">Neotravel</span>
      </div>
      <p className="text-[9px] font-medium text-white px-6 mb-3 tracking-widest">PILOTAGE</p>
      {NAV.map(({ label, href }) => {
        const active = pathname === href
        return active ? (
          <div key={href} className="mx-3 bg-[rgba(76,175,80,0.15)] rounded-[10px] flex items-center h-10 mb-1 relative overflow-hidden">
            <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#4caf50] rounded-r" />
            <span className="pl-5 text-white text-[13px] font-bold">{label}</span>
          </div>
        ) : (
          <Link key={href} href={href}
            className="px-7 py-3 text-white text-[13px] hover:bg-white/5 transition-colors block">
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
