'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { AdminBottomNav } from '@/components/admin/navigation/AdminBottomNav'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <div className="admin-login-shell">{children}</div>
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__mobile-header">
        <img src="/brand/kevphonesgc-logo.PNG" alt="" width={32} height={32} />
        <span>KevPhonesGC</span>
        <span className="admin-shell__label">Admin</span>
      </header>
      <AdminBottomNav />
      <div className="admin-shell__content">{children}</div>
    </div>
  )
}
