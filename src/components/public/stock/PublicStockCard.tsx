import { PublicStockItem } from './PublicStockSection'

interface PublicStockCardProps {
  device: PublicStockItem
  onSelect: () => void
}

export function PublicStockCard({ device, onSelect }: PublicStockCardProps) {
  const formattedPrice = device.listing_price
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(device.listing_price)
    : null

  const isPhone = device.category === 'iphone'
  const isNew = device.condition === 'new'
  const hasWarranty = !!device.warranty_until

  return (
    <button 
      onClick={onSelect}
      className="text-left w-full bg-[#050506] border border-[#1F1F24] rounded-3xl overflow-hidden flex flex-col group hover:border-[#383840] transition-all duration-300 relative active:scale-[0.99]"
      aria-label={`Ver detalles de ${device.model_name}`}
    >
      
      {/* Top Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {isNew && (
          <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-medium rounded-full tracking-wide">
            Precintado
          </span>
        )}
        {hasWarranty && !isNew && (
          <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10 text-[10px] font-medium rounded-full tracking-wide">
            Con garantía
          </span>
        )}
      </div>

      {/* Image Area */}
      <div className="w-full h-64 bg-[#0A0A0C] flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[#0C0C0F] transition-colors duration-300">
        <div className="absolute inset-0 bg-purple-900/5 blur-[50px] rounded-full scale-50 group-hover:scale-100 transition-transform duration-700 pointer-events-none opacity-0 group-hover:opacity-100"></div>
        {device.catalog_image_url ? (
          <img 
            src={device.catalog_image_url} 
            alt={`${device.model_name} ${device.color || ''}`}
            className="w-full h-full object-contain relative z-10 group-hover:-translate-y-1 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center opacity-30 relative z-10">
            <svg className="w-10 h-10 text-zinc-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-zinc-500 tracking-wider font-medium">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1 w-full relative bg-[#050506]">
        
        {/* Device Name */}
        <h3 className="text-lg font-bold text-white mb-2 leading-tight">
          {device.model_name}
        </h3>
        
        {/* Specs Line */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[13px] text-zinc-400 font-medium">
          {device.storage && <span>{device.storage}</span>}
          {device.storage && device.color && <span className="text-zinc-600">·</span>}
          {device.color && <span>{device.color}</span>}
        </div>

        {/* Battery Line */}
        <div className="mb-6 h-5">
          {isPhone && device.battery_health !== null && (
            <span className="text-[12px] text-zinc-500 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Salud de batería: {device.battery_health}%
            </span>
          )}
        </div>

        {/* BIG Price & Bottom Support */}
        <div className="mt-auto pt-4 border-t border-[#1F1F24]/50 flex flex-col items-start w-full">
          <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">
            {formattedPrice || '-'}
          </span>
          <span className="text-[11px] text-purple-400/80 font-medium tracking-wide uppercase">
            Entrega en Canarias
          </span>
        </div>
        
      </div>
    </button>
  )
}
