'use client'

import { useId, useRef, useState } from 'react'
import { PublicStockCard } from './PublicStockCard'
import { PublicDeviceDetailModal } from './PublicDeviceDetailModal'

export type PublicStockItem = {
  id: string
  model_id: string
  storage: string | null
  color: string | null
  size: string | null
  connectivity: string | null
  chip: string | null
  memory: string | null
  case_type: string | null
  case_material: string | null
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
  discount_price: number | null
  created_at: string
  model_name: string
  brand: string
  category: string
  supports_battery_health: boolean
  supports_cycles: boolean
  catalog_image_url: string | null
  real_images: { id: string, url: string, position: number }[]
  custom_product_type?: string | null
  custom_specs?: Record<string, any> | string | null
}

interface PublicStockSectionProps {
  devices: PublicStockItem[]
  whatsappPhone: string | null
  contactEnabled: boolean
}

export function PublicStockSection({ devices, whatsappPhone, contactEnabled }: PublicStockSectionProps) {
  const [selectedDevice, setSelectedDevice] = useState<PublicStockItem | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Todos')

  const [searchText, setSearchText] = useState('')
  const [sortOrder, setSortOrder] = useState('recommended')
  const searchRef = useRef<HTMLInputElement>(null)
  const controlId = useId()

  // Preserve the existing labels, category mapping and default inventory order.
  const categories = [
    { label: 'Todos', value: null },
    { label: 'iPhone', value: 'iphone' },
    { label: 'Apple Watch', value: 'apple_watch' },
    { label: 'AirPods', value: 'airpods' },
    { label: 'iPad', value: 'ipad' },
    { label: 'PS5', value: 'ps5' },
    { label: 'Nintendo Switch', value: 'nintendo_switch' },
    { label: 'Otros', value: 'other' }
  ]
  const selectedCategory = categories.find(category => category.label === activeCategory)
  const query = searchText.trim().toLocaleLowerCase('es')
  const hasChanges = searchText.length > 0 || activeCategory !== 'Todos' || sortOrder !== 'recommended'
  const visibleCategories = categories.filter(category =>
    category.value === null || category.label === activeCategory || devices.some(device => device.category === category.value)
  )

  const filteredDevices = devices.filter(device => {
    const matchesCategory = !selectedCategory?.value || device.category === selectedCategory.value
    const matchesSearch = `${device.brand || ''} ${device.model_name || ''}`.toLocaleLowerCase('es').includes(query)
    return matchesCategory && matchesSearch
  })

  if (sortOrder !== 'recommended') {
    filteredDevices.sort((a, b) => {
      const priceA = a.discount_price ?? a.listing_price
      const priceB = b.discount_price ?? b.listing_price
      // Missing prices stay at the end in both directions. Ties retain source order.
      const hasPriceA = priceA !== null && Number.isFinite(priceA)
      const hasPriceB = priceB !== null && Number.isFinite(priceB)
      if (!hasPriceA) return hasPriceB ? 1 : 0
      if (!hasPriceB) return -1
      return sortOrder === 'price_asc' ? priceA! - priceB! : priceB! - priceA!
    })
  }

  const resetCatalogue = () => {
    setSearchText('')
    setActiveCategory('Todos')
    setSortOrder('recommended')
    searchRef.current?.focus()
  }

  return (
    <section className="kevphones-catalogue w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20" aria-labelledby={`${controlId}-title`}>
      <div className="kevphones-catalogue__header">
        <div className="kevphones-catalogue__title-row">
          <h2 id={`${controlId}-title`}>Catálogo</h2>
          <p role="status" aria-live="polite" aria-atomic="true">
            {filteredDevices.length} {filteredDevices.length === 1 ? 'disponible' : 'disponibles'}
          </p>
        </div>
        <p className="kevphones-catalogue__intro">Encuentra tu próximo dispositivo.</p>
      </div>

      <div className="kevphones-catalogue__controls">
        <div className="kevphones-catalogue__search">
          <label htmlFor={`${controlId}-search`} className="sr-only">Buscar por marca o modelo</label>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path strokeLinecap="round" d="m16 16 4 4" />
          </svg>
          <input
            ref={searchRef}
            id={`${controlId}-search`}
            type="search"
            placeholder="Buscar modelo..."
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {searchText.length > 0 && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => {
              setSearchText('')
              searchRef.current?.focus()
            }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          )}
        </div>

        <div className="kevphones-catalogue__categories" role="group" aria-label="Categorías del catálogo">
          {visibleCategories.map(category => (
            <button
              key={category.label}
              type="button"
              aria-pressed={activeCategory === category.label}
              onClick={event => {
                setActiveCategory(category.label)
                event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="kevphones-catalogue__sorting">
          <label htmlFor={`${controlId}-sort`} className="sr-only">Ordenar catálogo</label>
          <select id={`${controlId}-sort`} value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
            <option value="recommended">Recomendados</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
          {hasChanges && filteredDevices.length > 0 && (
            <button type="button" className="kevphones-catalogue__reset" onClick={resetCatalogue}>Limpiar filtros</button>
          )}
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
        <div className="kevphones-catalogue__empty">
          <h3>{hasChanges ? 'No encontramos dispositivos con estos filtros.' : 'No tenemos dispositivos disponibles ahora.'}</h3>
          {hasChanges ? (
            <button type="button" className="kevphones-catalogue__reset" onClick={resetCatalogue}>Limpiar filtros</button>
          ) : (
            <p>Vuelve a consultar el catálogo pronto.</p>
          )}
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
