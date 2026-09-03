import React from 'react'
import { AdminBottomNav } from '@/components/admin/navigation/AdminBottomNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
      
      {/* GLOBAL BRAND HEADER (z-50) */}
      <header className="bg-[#131313] fixed top-0 w-full z-50 border-b border-[#1F1F24] flex justify-between items-center px-4 md:px-8 h-14 left-0">
        <div className="flex items-center gap-2 text-[#d7baff] max-w-[1280px] mx-auto w-full">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <h1 className="font-bold text-[24px]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
        </div>
      </header>

      {/* BACKING BACKGROUND FOR NON-SHELLED PAGES */}
      <div className="pb-28 pt-14 bg-[#050505] min-h-screen text-[#F7F7F7] font-body-md" style={{ fontFamily: 'Inter, sans-serif' }}>
        {children}
      </div>

      <AdminBottomNav />
    </>
  )
}
