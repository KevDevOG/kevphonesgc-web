'use client'

import { useState } from 'react'
import { PublicStockCard } from './PublicStockCard'
import { PublicDeviceDetailModal } from './PublicDeviceDetailModal'

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
  has_invoice: boolean
  original_parts: boolean
  fully_functional: boolean
  warranty_until: string | null
  listing_price: number | null
  created_at: string
  model_name: string
  brand: string
  category: string
  supports_battery_health: boolean
  supports_cycles: boolean
  catalog_image_url: string | null
  real_images: { id: string, url: string, position: number }[]
}

interface PublicStockSectionProps {
  devices: PublicStockItem[]
}

export function PublicStockSection({ devices }: PublicStockSectionProps) {
  const [selectedDevice, setSelectedDevice] = useState<PublicStockItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Todos')

  const categories = ['Todos', 'iPhone', 'PS5', 'Nintendo Switch']

  const filteredDevices = devices.filter(d => {
    if (activeCategory === 'Todos') return true
    if (activeCategory === 'iPhone') return d.category === 'iphone'
    if (activeCategory === 'PS5') return d.category === 'ps5'
    if (activeCategory === 'Nintendo Switch') return d.category === 'nintendo_switch'
    return true
  })

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 flex items-center justify-center relative">
          Catálogo
          <span className="absolute -inset-1 bg-[#9867db]/20 blur-xl rounded-full opacity-50 z-0"></span>
        </h2>
        <p className="text-lg text-[#A8A8B0] max-w-2xl relative z-10">
          Cada unidad es única. {devices.length} disponibles ahora.
        </p>
        <div className="w-12 h-1 bg-gradient-to-r from-transparent via-[#9867db] to-transparent mt-6 mx-auto rounded-full" />
      </div>

      <div className="flex w-full overflow-x-auto no-scrollbar justify-start sm:justify-center mb-10 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 min-w-max">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9867db] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0D] ${
                activeCategory === category
                  ? 'bg-[#9867db]/15 border border-[#9867db]/40 text-[#d7baff] shadow-[0_0_15px_rgba(152,103,219,0.2)]'
                  : 'bg-[#131313]/60 border border-[#1F1F24] text-[#A8A8B0] hover:text-white hover:border-[#9867db]/40'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredDevices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map(device => (
            <PublicStockCard 
              key={device.id} 
              device={device} 
              onSelect={() => setSelectedDevice(device)} 
            />
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

      {selectedDevice && (
        <PublicDeviceDetailModal 
          device={selectedDevice} 
          onClose={() => setSelectedDevice(null)} 
        />
      )}
    </section>
  )
}
