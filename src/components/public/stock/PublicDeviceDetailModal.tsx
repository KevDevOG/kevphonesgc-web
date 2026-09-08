'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PublicStockItem } from './PublicStockSection'

interface PublicDeviceDetailModalProps {
  device: PublicStockItem
  onClose: () => void
  whatsappPhone: string | null
  contactEnabled: boolean
}

const CONDITION_LABELS: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

export function PublicDeviceDetailModal({ device, onClose, whatsappPhone, contactEnabled }: PublicDeviceDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  const isSealed = device.condition === 'sealed'
  const hasWarranty = device.warranty_until && new Date(device.warranty_until) > new Date()
  
  // Gallery logic
  const allPhotos = device.real_images.length > 0 
    ? device.real_images 
    : device.catalog_image_url 
      ? [{ id: 'catalog', url: device.catalog_image_url, position: 0 }] 
      : []

  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)

  // Safe History & Mount Logic
  const modalOpenRef = useRef(false)
  const previousOverflowRef = useRef<string>('')

  useEffect(() => {
    setMounted(true)
    
    if (!modalOpenRef.current) {
      window.history.pushState({ deviceModal: true }, '')
      modalOpenRef.current = true
    }
    
    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = previousOverflowRef.current
    }
  }, [])

  const safeClose = () => {
    if (modalOpenRef.current) {
      modalOpenRef.current = false
      if (window.history.state?.deviceModal) {
        window.history.back()
      }
    }
    onClose()
  }

  useEffect(() => {
    const handlePopState = () => {
      if (modalOpenRef.current) {
        modalOpenRef.current = false
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpenRef.current) {
        safeClose()
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const effectivePrice = device.discount_price ?? device.listing_price
  const formattedPrice = effectivePrice
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(effectivePrice)
    : null
    
  const formattedListingPrice = device.listing_price
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(device.listing_price)
    : null



  if (!mounted) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#000000]/80 backdrop-blur-sm overflow-y-auto animate-backdrop-fade"
      onClick={safeClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="relative w-full max-w-[1000px] bg-[#050506] border border-[#1F1F24] rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-2xl my-auto animate-modal-entrance"
        onClick={e => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center text-zinc-400 bg-[#0A0A0C]/80 hover:bg-[#1F1F24] hover:text-white border border-[#1F1F24] rounded-full transition-all duration-200"
          onClick={safeClose}
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Column: Photos */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#1F1F24] bg-[#0A0A0C]">
          <div className="w-full aspect-square relative flex items-center justify-center p-8 lg:p-16">
            <div className="absolute inset-0 bg-purple-900/5 blur-[70px] rounded-full scale-50 pointer-events-none"></div>
            {allPhotos.length > 0 ? (
              <img 
                src={allPhotos[mainPhotoIndex].url}
                alt={`${device.model_name} foto`}
                className="w-full h-full object-contain relative z-10"
              />
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-[#1F1F24] rounded-2xl flex items-center justify-center text-zinc-600 relative z-10">
                <span className="material-symbols-outlined text-5xl">smartphone</span>
              </div>
            )}
            
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-1.5">
              {isSealed && (
                <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-medium rounded-full tracking-wide">
                  Precintado
                </span>
              )}
              {!isSealed && hasWarranty && (
                <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10 text-[10px] font-medium rounded-full tracking-wide">
                  Con garantía
                </span>
              )}
            </div>
          </div>
          
          {allPhotos.length > 1 && (
            <div className="flex gap-2.5 p-5 overflow-x-auto no-scrollbar border-t border-[#1F1F24] bg-[#0A0A0C]">
              {allPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setMainPhotoIndex(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border transition-all duration-200 flex items-center justify-center bg-[#050506] ${idx === mainPhotoIndex ? 'border-purple-500/50' : 'border-[#1F1F24] hover:border-zinc-500'}`}
                >
                  <img src={photo.url} alt="Thumbnail" className="w-full h-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#050506]">
          
          <div className="mb-8">
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-semibold text-white mb-2 leading-tight">
              {device.model_name}
            </h2>
            {device.discount_price ? (
              <div className="flex flex-col mt-4">
                <div className="flex flex-col mb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">Precio habitual</span>
                  <span className="text-xl font-semibold text-zinc-500 line-through">{formattedListingPrice}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Precio en oferta</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] text-[10px] font-bold tracking-wide">
                      Oferta
                    </span>
                  </div>
                  <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{formattedPrice || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight mt-4">
                {formattedPrice || '-'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
              <div className="flex flex-col border-b border-[#1F1F24]/50 pb-2">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Estado</span>
                <span className="text-sm text-white font-medium">{CONDITION_LABELS[device.condition] || device.condition}</span>
              </div>
              
              {device.storage && (
                <div className="flex flex-col border-b border-[#1F1F24]/50 pb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Almacenamiento</span>
                  <span className="text-sm text-white font-medium">{device.storage}</span>
                </div>
              )}
              
              {device.color && (
                <div className="flex flex-col border-b border-[#1F1F24]/50 pb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Color</span>
                  <span className="text-sm text-white font-medium">{device.color}</span>
                </div>
              )}
              
              {device.supports_battery_health && device.battery_health !== null && (
                <div className="flex flex-col border-b border-[#1F1F24]/50 pb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Salud de batería</span>
                  <span className="text-sm text-white font-medium">{device.battery_health}%</span>
                </div>
              )}

              {device.supports_cycles && device.battery_cycles !== null && (
                <div className="flex flex-col border-b border-[#1F1F24]/50 pb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Ciclos</span>
                  <span className="text-sm text-white font-medium">{device.battery_cycles}</span>
                </div>
              )}

              {device.warranty_until && hasWarranty && (
                <div className="flex flex-col border-b border-[#1F1F24]/50 pb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Garantía oficial</span>
                  <span className="text-sm text-white font-medium">
                    {new Date(device.warranty_until).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <span className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-3">Accesorios y Otros</span>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-md text-[11px] border font-medium ${device.has_box ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-[#1F1F24] text-zinc-500'}`}>Caja</span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] border font-medium ${device.has_cable ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-[#1F1F24] text-zinc-500'}`}>Cable</span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] border font-medium ${device.has_invoice ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-[#1F1F24] text-zinc-500'}`}>Factura</span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] border font-medium ${device.original_parts ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-[#1F1F24] text-zinc-500'}`}>Piezas originales</span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] border font-medium ${device.fully_functional ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-[#1F1F24] text-zinc-500'}`}>Funcionamiento completo</span>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-3">
            {contactEnabled && whatsappPhone ? (
              <a 
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Hola, estoy interesado en este dispositivo de KevPhonesGC:\n\n${device.model_name}\n${device.storage ? `${device.storage}\n` : ''}${device.color ? `${device.color}\n` : ''}Precio: ${effectivePrice ? `${effectivePrice} €` : 'No disponible'}\n\n¿Sigue disponible?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl font-semibold bg-[#1F8745] text-white hover:bg-[#25A154] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              >
                Preguntar por WhatsApp
              </a>
            ) : (
              <div>
                <button 
                  disabled
                  className="w-full py-4 rounded-xl font-semibold bg-[#111114] text-zinc-600 border border-[#1F1F24] flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  Contacto temporalmente no disponible
                </button>
              </div>
            )}

            <Link 
              href={`/cotizar?mode=trade_in&target=${device.id}`}
              className="w-full py-4 rounded-xl font-medium bg-transparent text-zinc-300 border border-[#1F1F24] hover:bg-[#111114] hover:text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              onClick={() => {
                document.body.style.overflow = previousOverflowRef.current
              }}
            >
              Entregar mi móvil como parte de pago
            </Link>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
