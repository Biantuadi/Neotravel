import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-9 overflow-auto">
        {/* Logo mobile */}
        <div className="flex items-center gap-3 mb-3 lg:hidden">
          <span className="w-6 h-6 rounded-full bg-[#4caf50] flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a5d6a7]" />
          </span>
          <span className="text-[#14141a] font-bold text-[15px]">Neotravel</span>
        </div>
        {children}
      </main>
    </div>
  )
}
