import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Sidebar />

      {/* Mobile topbar — logo centré + espace pour burger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-[#e8eaed] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#4caf50] flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-white/70" />
          </span>
          <span className="font-extrabold text-[16px] text-[#12151a] tracking-tight">Neotravel</span>
        </div>
      </div>

      {/* Contenu — décalé pour la sidebar (lg+) et la topbar (mobile) */}
      <main className="lg:pl-[220px] px-4 sm:px-6 lg:px-10 pt-20 lg:pt-9 pb-10 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
