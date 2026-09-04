import { PublicStockItem } from './PublicStockSection'

interface PublicStockCardProps {
  device: PublicStockItem
}

export function PublicStockCard({ device }: PublicStockCardProps) {
  const isSealed = device.condition === 'sealed'
  const hasWarranty = device.warranty_until && new Date(device.warranty_until) > new Date()

  const formattedPrice = device.listing_price
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(device.listing_price)
    : null

  return (
    <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-3xl overflow-hidden flex flex-col group hover:border-[#9867db]/50 transition-all duration-300 relative shadow-lg">
      
      {/* Badges Area */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {isSealed && (
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-black text-xs font-bold rounded-full shadow-lg">
            Precintado
          </span>
        )}
        {!isSealed && hasWarranty && (
          <span className="px-3 py-1 bg-[#9867db]/20 backdrop-blur-md text-[#d7baff] border border-[#9867db]/30 text-xs font-medium rounded-full shadow-lg">
            Con garantía
          </span>
        )}
      </div>

      {/* Image Area */}
      <div className="w-full aspect-[4/5] bg-gradient-to-b from-[#131313] to-[#0B0B0D] flex items-center justify-center p-8 relative overflow-hidden">
        {device.catalog_image_url ? (
          <img 
            src={device.catalog_image_url} 
            alt={`${device.model_name} ${device.color || ''}`}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-24 h-32 border-2 border-dashed border-[#1F1F24] rounded-xl flex items-center justify-center text-[#1F1F24]">
            <span className="material-symbols-outlined text-4xl">smartphone</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-white mb-2 leading-tight">
          {device.model_name}
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
          {device.storage && (
            <span className="text-sm text-[#A8A8B0]">{device.storage}</span>
          )}
          {device.storage && device.color && (
            <span className="text-[#333333]">•</span>
          )}
          {device.color && (
            <span className="text-sm text-[#A8A8B0]">{device.color}</span>
          )}
          {device.battery_health !== null && (
            <>
              <span className="text-[#333333]">•</span>
              <span className="text-sm text-[#A8A8B0]">Salud {device.battery_health}%</span>
            </>
          )}
        </div>

        {/* Compact Accessories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {device.has_box && (
            <span className="px-2 py-1 bg-[#131313] rounded-md text-xs text-[#6E6E78] border border-[#1F1F24]">Caja</span>
          )}
          {device.has_cable && (
            <span className="px-2 py-1 bg-[#131313] rounded-md text-xs text-[#6E6E78] border border-[#1F1F24]">Cable</span>
          )}
          {device.original_parts && (
            <span className="px-2 py-1 bg-[#131313] rounded-md text-xs text-[#6E6E78] border border-[#1F1F24]">Piezas orig.</span>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#6E6E78] mb-1 uppercase tracking-wider font-medium">Precio</span>
            <span className="text-2xl font-bold text-white">{formattedPrice || '-'}</span>
          </div>
          <button 
            className="w-12 h-12 rounded-full bg-[#131313] group-hover:bg-[#9867db] group-hover:text-white text-[#A8A8B0] border border-[#1F1F24] group-hover:border-[#9867db] flex items-center justify-center transition-all duration-300"
            aria-label="Ver detalles"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
