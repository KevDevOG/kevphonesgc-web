'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PublicStockItem } from './PublicStockSection'

interface PublicDeviceDetailModalProps {
  device: PublicStockItem
  onClose: () => void
}

const CONDITION_LABELS: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

export function PublicDeviceDetailModal({ device, onClose }: PublicDeviceDetailModalProps) {
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

  const formattedPrice = device.listing_price
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto"
      onClick={safeClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="relative w-full max-w-5xl bg-[#0B0B0D] border border-[#1F1F24] rounded-3xl overflow-hidden flex flex-col md:flex-row my-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center text-white bg-black/50 hover:bg-[#1F1F24] border border-[#1F1F24] rounded-full transition-colors"
          onClick={safeClose}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Left Column: Photos */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#1F1F24] bg-[#131313]">
          <div className="w-full aspect-square relative flex items-center justify-center p-8 bg-[#0B0B0D]">
            {allPhotos.length > 0 ? (
              <img 
                src={allPhotos[mainPhotoIndex].url}
                alt={`${device.model_name} foto`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-[#1F1F24] rounded-2xl flex items-center justify-center text-[#1F1F24]">
                <span className="material-symbols-outlined text-5xl">smartphone</span>
              </div>
            )}
            
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
          </div>
          
          {allPhotos.length > 1 && (
            <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-t border-[#1F1F24] bg-[#131313]">
              {allPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setMainPhotoIndex(idx)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors flex items-center justify-center bg-[#0B0B0D] ${idx === mainPhotoIndex ? 'border-[#9867db]' : 'border-[#1F1F24] hover:border-[#6E6E78]'}`}
                >
                  <img src={photo.url} alt="Thumbnail" className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col max-h-[85vh] overflow-y-auto">
          <div className="mb-8">
            <h2 id="modal-title" className="text-3xl font-bold text-white mb-2">{device.model_name}</h2>
            <div className="text-3xl font-bold text-[#9867db]">{formattedPrice || '-'}</div>
          </div>

          <div className="flex-1">
            <h3 className="text-sm uppercase tracking-widest text-[#6E6E78] font-bold mb-4">Especificaciones</h3>
            <ul className="space-y-4">
              <li className="flex justify-between items-center border-b border-[#1F1F24] pb-2">
                <span className="text-[#A8A8B0]">Estado</span>
                <span className="text-white font-medium">{CONDITION_LABELS[device.condition] || device.condition}</span>
              </li>
              {device.storage && (
                <li className="flex justify-between items-center border-b border-[#1F1F24] pb-2">
                  <span className="text-[#A8A8B0]">Almacenamiento</span>
                  <span className="text-white font-medium">{device.storage}</span>
                </li>
              )}
              {device.color && (
                <li className="flex justify-between items-center border-b border-[#1F1F24] pb-2">
                  <span className="text-[#A8A8B0]">Color</span>
                  <span className="text-white font-medium">{device.color}</span>
                </li>
              )}
              {device.supports_battery_health && device.battery_health !== null && (
                <li className="flex justify-between items-center border-b border-[#1F1F24] pb-2">
                  <span className="text-[#A8A8B0]">Salud de batería</span>
                  <span className="text-white font-medium">{device.battery_health}%</span>
                </li>
              )}
              {device.supports_cycles && device.battery_cycles !== null && (
                <li className="flex justify-between items-center border-b border-[#1F1F24] pb-2">
                  <span className="text-[#A8A8B0]">Ciclos</span>
                  <span className="text-white font-medium">{device.battery_cycles}</span>
                </li>
              )}
              {device.warranty_until && hasWarranty && (
                <li className="flex justify-between items-center border-b border-[#1F1F24] pb-2">
                  <span className="text-[#A8A8B0]">Garantía oficial hasta</span>
                  <span className="text-white font-medium">
                    {new Date(device.warranty_until).toLocaleDateString('es-ES')}
                  </span>
                </li>
              )}
            </ul>

            <h3 className="text-sm uppercase tracking-widest text-[#6E6E78] font-bold mt-8 mb-4">Accesorios y Otros</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm border ${device.has_box ? 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/30' : 'bg-[#131313] text-[#6E6E78] border-[#1F1F24]'}`}>
                Caja
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm border ${device.has_cable ? 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/30' : 'bg-[#131313] text-[#6E6E78] border-[#1F1F24]'}`}>
                Cable
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm border ${device.has_invoice ? 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/30' : 'bg-[#131313] text-[#6E6E78] border-[#1F1F24]'}`}>
                Factura
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm border ${device.original_parts ? 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/30' : 'bg-[#131313] text-[#6E6E78] border-[#1F1F24]'}`}>
                Piezas originales
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-sm border ${device.fully_functional ? 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/30' : 'bg-[#131313] text-[#6E6E78] border-[#1F1F24]'}`}>
                Funcionamiento completo
              </span>
            </div>
          </div>

          <div className="mt-10">
            {/* WhatsApp CTA disabled cleanly because no public number is configured */}
            <button 
              disabled
              className="w-full py-4 rounded-xl font-bold bg-[#131313] text-[#6E6E78] border border-[#1F1F24] flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Preguntar por WhatsApp
              <span className="text-xs font-normal opacity-70">(Próximamente)</span>
            </button>
            <p className="text-center text-xs text-[#6E6E78] mt-3">
              Actualmente estamos conectando nuestro WhatsApp. Por favor, vuelve pronto.
            </p>

            <div className="mt-4 pt-4 border-t border-[#1F1F24]">
              <Link 
                href={`/cotizar?mode=trade_in&target=${device.id}`}
                className="w-full py-4 rounded-xl font-bold bg-transparent text-[#9867db] border border-[#9867db]/30 hover:bg-[#9867db]/10 flex items-center justify-center gap-2 transition-colors"
                onClick={() => {
                  document.body.style.overflow = previousOverflowRef.current
                }}
              >
                Entregar mi iPhone como parte de pago
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
