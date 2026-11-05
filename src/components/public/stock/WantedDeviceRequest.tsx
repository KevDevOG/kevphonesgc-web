'use client'

import { useState, useId, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { submitWantedDeviceAction, WantedDeviceSource } from '@/actions/wanted-devices'
import { trackWantedRequestSubmitted } from '@/lib/analytics/events'

export interface WantedDeviceRequestProps {
  source: WantedDeviceSource
  category?: string
}

export function WantedDeviceRequest({ source, category }: WantedDeviceRequestProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const modalPanelRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const previousOverflowRef = useRef<string>('')

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [model, setModel] = useState('')
  const [storage, setStorage] = useState('')
  const [color, setColor] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [notes, setNotes] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const isIPhone = source === 'iphone_stock' || category === 'iphone'
  const idPrefix = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      firstInputRef.current?.focus({ preventScroll: true })
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
      if (e.key === 'Tab' && modalPanelRef.current) {
        const focusable = modalPanelRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = previousOverflowRef.current
      window.removeEventListener('keydown', handleKeyDown)
      triggerButtonRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  const handleOpen = () => {
    setIsSuccess(false)
    setErrorMessage(null)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Clear inputs if successfully submitted
    if (isSuccess) {
      setCustomerName('')
      setPhone('')
      setModel('')
      setStorage('')
      setColor('')
      setMaxBudget('')
      setNotes('')
      setHoneypot('')
      setIsSuccess(false)
    }
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setErrorMessage(null)

    if (!customerName.trim()) {
      setErrorMessage('Por favor, indica tu nombre.')
      return
    }

    const phoneTrimmed = phone.trim()
    const digitsOnly = phoneTrimmed.replace(/\D/g, '')
    const validPhoneChars = /^[0-9+\s\-().]+$/

    if (!phoneTrimmed || !validPhoneChars.test(phoneTrimmed) || digitsOnly.length < 6 || digitsOnly.length > 20) {
      setErrorMessage('Por favor, introduce un número de teléfono válido (mínimo 6 dígitos).')
      return
    }

    if (!model.trim()) {
      setErrorMessage('Por favor, indica qué modelo buscas.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitWantedDeviceAction({
        customer_name: customerName,
        phone: phoneTrimmed,
        model,
        category: isIPhone ? 'iphone' : (category || null),
        brand: isIPhone ? 'Apple' : null,
        storage: storage.trim() || null,
        color: color.trim() || null,
        max_budget: maxBudget.trim() ? Number(maxBudget.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
        notes: notes.trim() || null,
        source,
        website: honeypot
      })

      if (res.success) {
        setIsSuccess(true)
        trackWantedRequestSubmitted(source)
      } else {
        setErrorMessage(res.error || 'No se pudo guardar la solicitud.')
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = isIPhone
    ? '¿No encuentras el iPhone que buscas?'
    : '¿No encuentras lo que buscas?'

  const description = isIPhone
    ? 'Dinos qué modelo estás buscando y podremos contactarte si encontramos una opción que encaje.'
    : 'Dinos qué dispositivo estás buscando y podremos contactarte si encontramos una opción que encaje.'

  return (
    <>
      {/* Visual Public CTA */}
      <section 
        aria-labelledby={`${idPrefix}-wanted-cta-title`}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#23232a] bg-[#0c0c10] p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 shrink-0"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span>Aviso de stock</span>
              </div>
              <h2 
                id={`${idPrefix}-wanted-cta-title`}
                className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white"
              >
                {title}
              </h2>
              <p className="text-sm sm:text-base text-zinc-400">
                {description}
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <button
                ref={triggerButtonRef}
                type="button"
                onClick={handleOpen}
                className="inline-flex w-full md:w-auto min-h-12 items-center justify-center gap-2.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-6 py-3 text-center text-sm sm:text-base font-semibold text-purple-200 transition-all hover:bg-purple-900/60 hover:text-white hover:border-purple-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 active:scale-[0.99]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 shrink-0"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span>Avísame cuando entre</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Dialog */}
      {mounted && isOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={handleClose}
        >
          <div
            ref={modalPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-modal-title`}
            className="relative w-full max-w-lg my-auto rounded-2xl border border-[#2b2b36] bg-[#101015] p-5 sm:p-8 text-white shadow-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus-visible:outline-2 focus-visible:outline-purple-400 active:scale-95"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="overflow-y-auto pr-1 sm:pr-2">
              {isSuccess ? (
                <div className="text-center py-6 sm:py-8 space-y-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 mb-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-7 h-7"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3 id={`${idPrefix}-modal-title`} className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    ¡Aviso guardado con éxito!
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Solicitud guardada. Si encontramos una opción que encaje con lo que buscas, podremos contactarte.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-purple-400"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-5 sm:mb-6 pr-12">
                    <h3 id={`${idPrefix}-modal-title`} className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {isIPhone ? 'Avísame cuando entre un iPhone' : 'Avísame cuando entre tu dispositivo'}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Indícanos qué modelo estás buscando y te escribiremos si entra uno en stock.
                    </p>
                  </div>

                  {errorMessage && (
                    <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                      {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 text-left">
                    {/* Anti-bot Honeypot field (hidden from normal users and screen readers, not keyboard-focusable) */}
                    <div
                      aria-hidden="true"
                      className="opacity-0 absolute -left-[9999px] -top-[9999px] h-0 w-0 overflow-hidden pointer-events-none select-none"
                      tabIndex={-1}
                    >
                      <label htmlFor={`${idPrefix}-website`}>No rellenar este campo si eres humano</label>
                      <input
                        id={`${idPrefix}-website`}
                        type="text"
                        name="website"
                        autoComplete="off"
                        tabIndex={-1}
                        value={honeypot}
                        onChange={e => setHoneypot(e.target.value)}
                      />
                    </div>

                    {/* Nombre */}
                    <div>
                      <label htmlFor={`${idPrefix}-name`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                        Nombre <span className="text-purple-400">*</span>
                      </label>
                      <input
                        ref={firstInputRef}
                        id={`${idPrefix}-name`}
                        type="text"
                        required
                        maxLength={120}
                        placeholder="Tu nombre"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label htmlFor={`${idPrefix}-phone`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                        Teléfono / WhatsApp <span className="text-purple-400">*</span>
                      </label>
                      <input
                        id={`${idPrefix}-phone`}
                        type="tel"
                        required
                        maxLength={30}
                        placeholder="ej. 600 000 000"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Modelo */}
                    <div>
                      <label htmlFor={`${idPrefix}-model`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                        Modelo que buscas <span className="text-purple-400">*</span>
                      </label>
                      <input
                        id={`${idPrefix}-model`}
                        type="text"
                        required
                        maxLength={150}
                        placeholder={isIPhone ? 'ej. iPhone 15 Pro, iPhone 14 128GB...' : 'ej. iPhone 15 Pro, PS5, iPad Air...'}
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Capacidad y Color (Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor={`${idPrefix}-storage`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                          Capacidad <span className="text-zinc-500 font-normal lowercase">(opcional)</span>
                        </label>
                        <input
                          id={`${idPrefix}-storage`}
                          type="text"
                          maxLength={50}
                          placeholder="ej. 128 GB, 256 GB"
                          value={storage}
                          onChange={e => setStorage(e.target.value)}
                          className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${idPrefix}-color`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                          Color <span className="text-zinc-500 font-normal lowercase">(opcional)</span>
                        </label>
                        <input
                          id={`${idPrefix}-color`}
                          type="text"
                          maxLength={80}
                          placeholder="ej. Titanio, Negro"
                          value={color}
                          onChange={e => setColor(e.target.value)}
                          className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Presupuesto Máximo */}
                    <div>
                      <label htmlFor={`${idPrefix}-budget`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                        Presupuesto máximo <span className="text-zinc-500 font-normal lowercase">(opcional)</span>
                      </label>
                      <input
                        id={`${idPrefix}-budget`}
                        type="text"
                        maxLength={20}
                        placeholder="ej. 800 €"
                        value={maxBudget}
                        onChange={e => setMaxBudget(e.target.value)}
                        className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Notas */}
                    <div>
                      <label htmlFor={`${idPrefix}-notes`} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                        Notas o preferencias <span className="text-zinc-500 font-normal lowercase">(opcional)</span>
                      </label>
                      <textarea
                        id={`${idPrefix}-notes`}
                        rows={2}
                        maxLength={1000}
                        placeholder="Estado preferido de batería, accesorios que necesitas, etc."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full rounded-xl border border-[#2b2b36] bg-[#16161d] px-3.5 py-2 text-sm text-white placeholder-zinc-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    {/* Consentimiento / Privacidad */}
                    <div className="pt-0.5">
                      <p className="text-xs text-zinc-400 leading-normal">
                        Usaremos tus datos de contacto únicamente para informarte sobre esta búsqueda.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 pb-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full inline-flex min-h-12 items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-purple-900/30 transition-all hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-purple-400"
                      >
                        {isSubmitting ? 'Guardando aviso...' : 'Guardar aviso'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
