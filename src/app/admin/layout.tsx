import { AdminShell } from '@/components/admin/layout/AdminShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {children}
    </AdminShell>
  )
}
