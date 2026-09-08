'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { AdminBottomNav } from '@/components/admin/navigation/AdminBottomNav'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return (
      <div className="bg-[#050506] min-h-screen w-full">
        {children}
      </div>
    )
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      
      {/* MOBILE TOP HEADER */}
      <header className="lg:hidden bg-[#0B0B0E]/95 backdrop-blur-md fixed top-0 w-full z-40 border-b border-[#1F1F24] flex items-center px-4 h-14 left-0">
        <div className="flex items-center gap-3">
          <img src="/brand/kevphonesgc-logo.PNG" alt="KevPhonesGC" className="w-8 h-8 rounded-[8px] object-cover" />
          <div className="flex flex-col justify-center">
            <span className="font-bold text-white text-[15px] leading-none mb-1 tracking-tight">KevPhonesGC</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Admin</span>
          </div>
        </div>
      </header>

      {/* NAVIGATION (Sidebar + Mobile Bottom Nav) */}
      <AdminBottomNav />

      {/* BACKGROUND AND MAIN CONTENT OFFSET */}
      <div className="bg-[#050506] min-h-screen text-white font-sans pt-14 pb-20 lg:pt-0 lg:pb-0 lg:pl-[260px]">
        {children}
      </div>
    </>
  )
}
