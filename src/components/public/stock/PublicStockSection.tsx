import { PublicStockCard } from './PublicStockCard'

export type PublicStockItem = {
  id: string
  model_id: string
  storage: string | null
  color: string | null
  battery_health: number | null
  battery_cycles: number | null
  condition: string
  has_box: boolean
  has_cable: boolean
  original_parts: boolean
  fully_functional: boolean
  warranty_until: string | null
  listing_price: number | null
  created_at: string
  model_name: string
  brand: string
  category: string
  catalog_image_url: string | null
}

interface PublicStockSectionProps {
  devices: PublicStockItem[]
}

export function PublicStockSection({ devices }: PublicStockSectionProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Stock disponible
        </h2>
        <p className="text-lg text-[#A8A8B0] max-w-2xl">
          Dispositivos revisados y listos para entrega.
        </p>
      </div>

      {devices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map(device => (
            <PublicStockCard key={device.id} device={device} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0B0B0D] border border-[#1F1F24] rounded-3xl text-center px-4">
          <span className="material-symbols-outlined text-5xl text-[#6E6E78] mb-6">inventory_2</span>
          <h3 className="text-xl font-bold text-white mb-2">
            Ahora mismo no tenemos dispositivos disponibles.
          </h3>
          <p className="text-[#A8A8B0]">
            Estamos renovando el stock constantemente. Vuelve a consultarlo pronto.
          </p>
        </div>
      )}
    </section>
  )
}
