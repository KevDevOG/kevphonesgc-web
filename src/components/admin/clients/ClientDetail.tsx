'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateClientAction, deleteClientAction } from '@/actions/clients'

type Client = {
  id: string
  name: string
  phone: string
  location: string | null
  created_at: string
}

type DeviceModel = {
  category: string
  name: string
}

type Device = {
  id: string
  storage: string | null
  color: string | null
  imei_serial: string | null
  purchase_price: number
  listing_price: number
  purchased_at?: string
  status?: string
  device_models: DeviceModel
}

type Sale = {
  id: string
  final_sale_price: number
  sold_at: string
  sale_location: string | null
  observations: string | null
  created_at: string
  devices: Device
}

type Props = {
  client: Client
  sales: Sale[] // Devices the client bought FROM us
  devices: Device[] // Devices the client sold TO us
}

function maskImei(imei: string | null) {
  if (!imei || imei.length <= 4) return imei || ''
  return `•••• ${imei.slice(-4)}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

function getMonthYearString(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export function ClientDetail({ client, sales, devices }: Props) {
  const router = useRouter()
  const purchases_count = sales.length
  const purchases_total = sales.reduce((acc, sale) => acc + Number(sale.final_sale_price), 0)

  const sales_to_business_count = devices.length
  const paid_to_client_total = devices.reduce((acc, dev) => acc + Number(dev.purchase_price), 0)

  const hasPurchaseAmounts = devices.every(device => device.purchase_price != null && Number.isFinite(Number(device.purchase_price)))
  const hasSaleAmounts = sales.every(sale => sale.final_sale_price != null && Number.isFinite(Number(sale.final_sale_price)))

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await updateClientAction(client.id, formData)
      if (!res.success) {
        setError(res.error || 'No se pudo actualizar el cliente. Inténtalo de nuevo.')
      } else {
        setIsEditing(false)
      }
    } catch (err) {
      setError('No se pudo actualizar el cliente. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    try {
      const res = await deleteClientAction(client.id)
      if (!res.success) {
        setError(res.error || 'No se pudo eliminar el cliente. Inténtalo de nuevo.')
      } else {
        router.push('/admin/clientes')
      }
    } catch (err) {
      setError('No se pudo eliminar el cliente. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="admin-client-detail">
      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-[20px] font-bold text-[#F7F7F7] uppercase tracking-wider border-b border-[#1F1F24] pb-2">Editar cliente</h3>
            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#A8A8B0]">Nombre</label>
                <input required name="name" defaultValue={client.name} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#A8A8B0]">Teléfono</label>
                <input required name="phone" defaultValue={client.phone} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-[#A8A8B0]">Ubicación (opcional)</label>
                <input name="location" defaultValue={client.location || ''} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setError(null); }}
                  disabled={isPending}
                  className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#7a32d4] hover:bg-[#6e02d2] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-[20px] font-bold text-[#ffb4ab] uppercase tracking-wider border-b border-[#93000a]/30 pb-2">¿Eliminar este cliente?</h3>
            <p className="text-[14px] text-[#A8A8B0]">Solo se podrá eliminar si no tiene compras o ventas asociadas.</p>
            <p className="text-[14px] text-[#A8A8B0] font-semibold">Las operaciones históricas nunca se eliminarán.</p>
            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleDelete} className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setIsDeleting(false); setError(null); }}
                disabled={isPending}
                className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-[#93000a] hover:bg-[#690005] text-[#ffb4ab] font-bold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-[#ffb4ab]/30"
              >
                {isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </form>
          </div>
        </div>
      )}


      <header className="admin-client-detail__header">
        <Link href="/admin/clientes" className="admin-client-detail__back"><span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>Volver a clientes</Link>
        <div className="admin-client-detail__heading">
          <h1>{client.name || 'Cliente sin nombre'}</h1>
          <button type="button" className="admin-client-detail__edit" onClick={() => setIsEditing(true)}><span aria-hidden="true" className="material-symbols-outlined">edit</span>Editar cliente</button>
        </div>
        <dl className="admin-client-detail__contact">
          <div><dt>Teléfono</dt><dd>{client.phone || 'No indicado'}</dd></div>
          {client.location && <div><dt>Ubicación</dt><dd>{client.location}</dd></div>}
          <div><dt>Cliente desde</dt><dd>{getMonthYearString(client.created_at)}</dd></div>
        </dl>
        {client.phone && (
        <button
          type="button"
          onClick={() => {
            const num = client.phone.replace(/[^0-9]/g, '')
            if (num) window.open(`https://wa.me/34${num}`, '_blank')
          }}
          className="admin-client-detail__contact-action"
        >
          <svg aria-hidden="true" fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.811.883 3.145.883 3.182 0 5.768-2.585 5.768-5.766 0-3.181-2.586-5.767-5.764-5.765zM20 12c0 4.418-3.582 8-8 8-.918 0-1.782-.158-2.593-.443l-5.309 1.393 1.41-5.181C4.78 14.39 4 13.253 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8zm-3.586 2.046c-.198-.099-1.17-.578-1.352-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-8.36-.31-1.167-.936-.307-.238-.413-.423-.585-.705-.164-.265-.018-.409.083-.507.09-.089.197-.232.296-.347.1-.116.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path>
          </svg>
          Contactar por WhatsApp
        </button>
        )}
      </header>

      <dl className="admin-client-detail__summary" aria-label="Operaciones registradas con este cliente">
        <div>
          <dt>Compras a este cliente</dt>
          <dd><strong>{sales_to_business_count}</strong> {sales_to_business_count === 1 ? 'dispositivo' : 'dispositivos'}</dd>
          {hasPurchaseAmounts && <dd className="admin-client-detail__total">Total registrado: <span>{formatCurrency(paid_to_client_total)}</span></dd>}
        </div>
        <div>
          <dt>Ventas a este cliente</dt>
          <dd><strong>{purchases_count}</strong> {purchases_count === 1 ? 'dispositivo' : 'dispositivos'}</dd>
          {hasSaleAmounts && <dd className="admin-client-detail__total">Total registrado: <span>{formatCurrency(purchases_total)}</span></dd>}
        </div>
      </dl>

      <section className="admin-client-detail__history" aria-labelledby="client-purchases-title">
        <h2 id="client-purchases-title">Dispositivos comprados al cliente <span>{devices.length}</span></h2>
        {devices.length === 0 ? <p className="admin-client-detail__empty">No hay compras registradas a este cliente.</p> : (
          <table role="table" className="admin-client-detail__table">
            <caption className="sr-only">Compras de KevPhones a este cliente</caption>
            <thead><tr><th scope="col">Dispositivo</th><th scope="col">Precio de compra</th><th scope="col">Fecha de compra</th><th scope="col">Estado actual</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{devices.map(device => (
              <tr key={device.id} className="admin-client-detail__transaction">
                <td className="admin-client-detail__product"><strong>{device.device_models?.name || 'Modelo no disponible'}</strong><span>{[device.storage, device.color, maskImei(device.imei_serial)].filter(Boolean).join(' · ')}</span></td>
                <td className="admin-client-detail__amount">{device.purchase_price != null ? formatCurrency(device.purchase_price) : 'Sin importe registrado'}</td>
                <td className="admin-client-detail__date">{device.purchased_at ? <time dateTime={device.purchased_at}>{formatDate(device.purchased_at)}</time> : 'Sin fecha'}</td>
                <td className="admin-client-detail__context"><span className="admin-client-detail__status" data-status={device.status}>{device.status === 'available' ? 'Disponible' : device.status === 'sold' ? 'Vendido' : device.status || 'Sin estado'}</span></td>
                <td className="admin-client-detail__open"><Link href={`/admin/stock/${device.id}`}>Ver dispositivo<span className="sr-only">: {device.device_models?.name || 'modelo no disponible'}</span></Link></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>

      <section className="admin-client-detail__history" aria-labelledby="client-sales-title">
        <h2 id="client-sales-title">Dispositivos vendidos al cliente <span>{sales.length}</span></h2>
        {sales.length === 0 ? <p className="admin-client-detail__empty">No hay ventas registradas a este cliente.</p> : (
          <table role="table" className="admin-client-detail__table">
            <caption className="sr-only">Ventas de KevPhones a este cliente</caption>
            <thead><tr><th scope="col">Dispositivo</th><th scope="col">Precio final de venta</th><th scope="col">Fecha de venta</th><th scope="col">Lugar de venta</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{sales.map(sale => (
              <tr key={sale.id} className="admin-client-detail__transaction">
                <td className="admin-client-detail__product"><strong>{sale.devices?.device_models?.name || 'Modelo no disponible'}</strong><span>{sale.devices && [sale.devices.storage, sale.devices.color, maskImei(sale.devices.imei_serial)].filter(Boolean).join(' · ')}</span>
                  {sale.observations && <details className="admin-client-detail__notes"><summary>Observaciones de venta</summary><p>{sale.observations}</p></details>}
                </td>
                <td className="admin-client-detail__amount">{sale.final_sale_price != null ? formatCurrency(sale.final_sale_price) : 'Sin importe registrado'}</td>
                <td className="admin-client-detail__date">{sale.sold_at ? <time dateTime={sale.sold_at}>{formatDate(sale.sold_at)}</time> : 'Sin fecha'}</td>
                <td className="admin-client-detail__context">{sale.sale_location || 'Sin ubicación'}</td>
                <td className="admin-client-detail__open">{sale.devices?.id ? <Link href={`/admin/stock/${sale.devices.id}`}>Ver dispositivo<span className="sr-only">: {sale.devices.device_models?.name || 'modelo no disponible'}</span></Link> : <span>Dispositivo no disponible</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>

      <footer className="admin-client-detail__footer">
        <button type="button" className="admin-client-detail__delete" onClick={() => setIsDeleting(true)}><span aria-hidden="true" className="material-symbols-outlined">delete</span>Eliminar cliente</button>
      </footer>
    </div>
  )
}
