import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { WantedDevicesList, WantedDeviceRecord } from '@/components/admin/wanted-devices/WantedDevicesList'

export const dynamic = 'force-dynamic'

export default async function AdminWantedDevicesPage() {
  await requireAdmin()

  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('wanted_devices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wanted devices:', error)
  }

  return <WantedDevicesList initialRequests={(requests as WantedDeviceRecord[]) || []} />
}

