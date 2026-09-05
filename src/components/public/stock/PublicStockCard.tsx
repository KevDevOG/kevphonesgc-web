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

  return (
    <button 
      onClick={onSelect}
      className="text-left w-full bg-[#0B0B0D] border border-[#1F1F24] rounded-[2rem] overflow-hidden flex flex-col group hover:border-[#9867db]/50 hover:shadow-[0_0_25px_rgba(152,103,219,0.12)] transition-all duration-300 relative"
      aria-label={`Ver detalles de ${device.model_name}`}
    >
      
      {/* Top Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1 bg-[#9867db]/10 backdrop-blur-md text-[#d7baff] border border-[#9867db]/20 group-hover:border-[#9867db]/40 transition-colors text-[10px] font-bold rounded-full uppercase tracking-widest">
          Disponible
        </span>
      </div>

      {/* Image Area */}
      <div className="w-full h-56 bg-gradient-to-b from-[#131313]/50 to-[#0B0B0D] flex items-center justify-center p-6 relative overflow-hidden">
        {device.catalog_image_url ? (
          <img 
            src={device.catalog_image_url} 
            alt={`${device.model_name} ${device.color || ''}`}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center opacity-40">
            <span className="material-symbols-outlined text-4xl text-[#8E8E98] font-light mb-2">smartphone</span>
            <span className="text-[10px] text-[#8E8E98] uppercase tracking-wider font-medium">Imagen próximamente</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 pt-3 flex flex-col flex-1 w-full text-center items-center">
        <h3 className="text-lg font-bold text-white mb-1 leading-tight">
          {device.model_name}
        </h3>
        
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 mb-2">
          {device.storage && (
            <span className="text-sm text-[#8E8E98]">{device.storage}</span>
          )}
          {device.storage && device.color && (
            <span className="text-[#333333]">·</span>
          )}
          {device.color && (
            <span className="text-sm text-[#8E8E98]">{device.color}</span>
          )}
        </div>

        {/* Battery / Conditional Info */}
        <div className="h-6 mb-4 flex items-center justify-center">
          {isPhone && device.battery_health !== null && (
            <span className="text-xs font-medium text-[#d7baff] bg-[#9867db]/10 px-2 py-0.5 rounded border border-[#9867db]/20">
              Batería {device.battery_health}%
            </span>
          )}
        </div>

        {/* Price & Secondary Line */}
        <div className="mt-auto flex flex-col items-center w-full">
          <span className="text-xl font-bold text-white mb-1">{formattedPrice || '-'}</span>
          <span className="text-xs text-[#9867db]/70 font-medium tracking-wide">
            Disponible en Canarias
          </span>
        </div>
      </div>
    </button>
  )
}
