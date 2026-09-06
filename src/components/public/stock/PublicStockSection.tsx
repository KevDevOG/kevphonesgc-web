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
  whatsappPhone: string | null
  contactEnabled: boolean
}

export function PublicStockSection({ devices, whatsappPhone, contactEnabled }: PublicStockSectionProps) {
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
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 flex items-center justify-center relative">
          Catálogo
          <span className="absolute -inset-1 bg-purple-900/20 blur-xl rounded-full opacity-50 z-0 pointer-events-none"></span>
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl relative z-10 font-light">
          Cada unidad es única. <span className="text-white font-medium">{devices.length}</span> disponibles ahora.
        </p>
      </div>

      <div className="flex w-full overflow-x-auto no-scrollbar justify-start sm:justify-center mb-12 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 min-w-max p-1.5 bg-[#0B0B0E] border border-[#1F1F24] rounded-full shadow-sm">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506] ${
                activeCategory === category
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                  : 'bg-transparent border border-transparent text-zinc-400 hover:text-white hover:bg-[#111114]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredDevices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredDevices.map(device => (
            <PublicStockCard 
              key={device.id} 
              device={device} 
              onSelect={() => setSelectedDevice(device)} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-[#050506] border border-[#1F1F24] rounded-3xl text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-900/5 blur-[80px] rounded-full pointer-events-none"></div>
          <svg className="w-12 h-12 text-zinc-600 mb-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2 relative z-10">
            No tenemos dispositivos disponibles
          </h3>
          <p className="text-zinc-500 relative z-10">
            Estamos renovando el stock constantemente. Vuelve a consultarlo pronto.
          </p>
        </div>
      )}

      {selectedDevice && (
        <PublicDeviceDetailModal 
          device={selectedDevice} 
          onClose={() => setSelectedDevice(null)} 
          whatsappPhone={whatsappPhone}
          contactEnabled={contactEnabled}
        />
      )}
    </section>
  )
}
