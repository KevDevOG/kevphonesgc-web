import React from 'react'

export function AdminPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-[#050505] overflow-y-auto pt-14 pb-28">
      <main className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-6 min-h-full">
        {children}
      </main>
    </div>
  )
}
