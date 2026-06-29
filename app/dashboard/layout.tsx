import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar />
      {/* pl-14 sur mobile pour laisser la place au burger fixe */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-9 pl-14 sm:pl-16 lg:pl-10 overflow-auto">
        {children}
      </main>
    </div>
  )
}
