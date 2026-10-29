'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  simulateWhatsAppResponseAction,
  type WhatsAppSimulatorResult,
} from '@/actions/whatsapp-simulator'
import type { WhatsAppConversationState } from '@/lib/whatsapp/assistant'

interface ChatEntry {
  id: string
  clientMessage: string
  clientName?: string
  result: WhatsAppSimulatorResult
  timestamp: string
}

const EXAMPLE_PROMPTS = [
  'Hola',
  '¿Qué iPhone tienes disponibles?',
  'Tengo 600 euros',
  'Busco algo por menos de 700',
  'Busco un Pro por menos de 800',
  'Busco un Pro',
  'Quiero un iPhone de 256 GB',
  'Quiero el que tenga mejor batería',
  'Tengo entre 500 y 650 euros',
  'Quiero 256 GB y mínimo 90% de batería',
  'Quiero vender mi iPhone',
  'Tengo un quince pro de doscientos cincuenta y seis y está casi nuevo',
  'Quiero hablar con Kevin',
]

const AWAITING_FIELD_LABELS: Record<string, string> = {
  model: 'modelo',
  storage: 'capacidad',
  battery_health: 'salud de batería',
  batteryHealth: 'salud de batería',
  condition: 'estado',
  accessories: 'accesorios',
  maxBudget: 'presupuesto máximo',
}

export function WhatsAppSimulator() {
  const [inputText, setInputText] = useState('')
  const [senderName, setSenderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ChatEntry[]>([])
  const [conversationState, setConversationState] = useState<WhatsAppConversationState>({
    flow: 'none',
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (history.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const textToTest = inputText.trim()
    if (!textToTest || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await simulateWhatsAppResponseAction(textToTest, senderName, conversationState)
      if (!res.success) {
        setError(res.error || 'Error al procesar la respuesta')
        return
      }

      const newEntry: ChatEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        clientMessage: textToTest,
        clientName: senderName.trim() || undefined,
        result: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      // Chronological conversation order
      setHistory((prev) => [...prev, newEntry])
      setConversationState(res.conversationState ?? { flow: 'none' })
      setInputText('')
    } catch (err) {
      console.error('Simulator error:', err)
      setError('Ocurrió un error inesperado al simular la respuesta')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setInputText(example)
    setError(null)
  }

  const handleClearHistory = () => {
    setHistory([])
    setConversationState({ flow: 'none' })
    setError(null)
  }

  const handleResetFlow = () => {
    setInputText('cancelar')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. INPUT FORM & CONTROLS */}
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-5">
        {/* Active Flow Indicator */}
        {conversationState.flow !== 'none' && (
          <div className="flex items-center justify-between bg-[#7a32d4]/10 border border-[#7a32d4]/30 rounded-xl px-4 py-2.5 text-xs text-[#d7baff]">
            <span className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[17px] text-[#d7baff]">psychology</span>
              <span>
                Flujo activo:{' '}
                <strong className="text-white uppercase tracking-wide">
                  {conversationState.flow === 'selling' ? 'Venta de dispositivo' : 'Compra'}
                </strong>
                {conversationState.awaitingField && (
                  <span className="text-zinc-300">
                    {' '}
                    (esperando:{' '}
                    <code className="text-amber-300 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
                      {AWAITING_FIELD_LABELS[conversationState.awaitingField] || conversationState.awaitingField}
                    </code>
                    )
                  </span>
                )}
              </span>
            </span>
            <button
              type="button"
              onClick={handleResetFlow}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer transition-colors"
            >
              Cancelar flujo
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Optional sender name */}
          <div className="flex flex-col gap-1.5 max-w-sm">
            <label htmlFor="sender-name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Nombre del cliente (opcional)
            </label>
            <input
              id="sender-name"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Ej. Carlos"
              className="bg-[#141418] border border-[#27272F] rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7a32d4] transition-colors"
            />
          </div>

          {/* Test message textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="test-message" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Escribe un mensaje de prueba
            </label>
            <textarea
              id="test-message"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje o responde a la pregunta del asistente..."
              className="bg-[#141418] border border-[#27272F] rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7a32d4] transition-colors resize-y min-h-[80px]"
            />
          </div>

          {/* Submit button and clear action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="inline-flex items-center gap-2 bg-[#7a32d4] hover:bg-[#8d40f2] active:bg-[#6826b8] disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#7a32d4]/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Evaluando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                  <span>Probar respuesta</span>
                </>
              )}
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 py-2 px-3 rounded-lg hover:bg-[#1F1F24] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Limpiar conversación</span>
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-xs text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Clickable Quick Examples */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1F1F24]">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Ejemplos rápidos para probar (haz clic para insertar):
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleExampleClick(prompt)}
                className="text-xs bg-[#16161B] hover:bg-[#202027] text-zinc-300 hover:text-white px-3 py-1.5 rounded-full border border-[#27272F] transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CONVERSATION THREAD */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Conversación ({history.length} interacción{history.length === 1 ? '' : 'es'})
          </h3>
          {history.length > 0 && (
            <span className="text-xs text-zinc-500">
              Memoria temporal activa para la sesión
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-[#0B0B0E]/60 border border-dashed border-[#1F1F24] rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2.5">
            <span className="material-symbols-outlined text-zinc-600 text-[40px]">forum</span>
            <p className="text-zinc-400 text-sm font-medium">No hay mensajes de prueba aún</p>
            <p className="text-zinc-600 text-xs max-w-sm">
              Selecciona uno de los ejemplos rápidos arriba o escribe tu propia consulta para comenzar una conversación con el asistente.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {history.map((entry) => {
              const state = entry.result.conversationState
              const selling = state?.selling

              // Collect gathered fields for technical panel
              const collectedDetails: string[] = []
              if (selling?.model) collectedDetails.push(`Modelo: ${selling.model}`)
              if (selling?.storage) collectedDetails.push(`Capacidad: ${selling.storage}`)
              if (selling?.batteryHealth != null) collectedDetails.push(`Batería: ${selling.batteryHealth}%`)
              if (selling?.condition) collectedDetails.push(`Estado: ${selling.condition}`)
              if (selling?.accessories) collectedDetails.push(`Accesorios: ${selling.accessories}`)

              // Collect buying preferences (Section 9)
              const prefs = entry.result.appliedPreferences || state?.buying
              const collectedPreferences: string[] = []
              if (prefs?.maxBudget != null) collectedPreferences.push(`Presupuesto máximo: ${prefs.maxBudget} €`)
              if (prefs?.minBudget != null) collectedPreferences.push(`Presupuesto mínimo: ${prefs.minBudget} €`)
              if (prefs?.storage) collectedPreferences.push(`Capacidad: ${prefs.storage}`)
              if (prefs?.modelFamily) collectedPreferences.push(`Familia: ${prefs.modelFamily}`)
              if (prefs?.minBatteryHealth != null) collectedPreferences.push(`Batería mínima: ${prefs.minBatteryHealth}%`)
              if (prefs?.bestBattery) collectedPreferences.push('Prioridad: Mejor batería')

              return (
                <div key={entry.id} className="flex flex-col gap-3">
                  {/* User Message Bubble (Right aligned) */}
                  <div className="ml-auto bg-[#16161D] border border-[#262630] rounded-2xl rounded-tr-sm p-4 max-w-[90%] md:max-w-[80%] shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 pb-1 mb-1 border-b border-[#262630]">
                      <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-zinc-400">person</span>
                        Cliente{entry.clientName ? ` (${entry.clientName})` : ''}:
                      </span>
                      <span className="text-[11px] text-zinc-500">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm text-zinc-100 font-medium">{entry.clientMessage}</p>
                  </div>

                  {/* Assistant Response Bubble (Left aligned) */}
                  <div className="mr-auto bg-[#14111E] border border-[#7a32d4]/30 rounded-2xl rounded-tl-sm p-4 max-w-[95%] md:max-w-[85%] shadow-md flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 text-xs text-[#d7baff] pb-1 border-b border-[#7a32d4]/20">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#d7baff]">smart_toy</span>
                        Asistente:
                      </span>
                    </div>

                    <div className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                      {entry.result.text || (
                        <span className="text-zinc-500 italic">(Sin respuesta de texto emitida)</span>
                      )}
                    </div>

                    {/* Compact Technical Debug Panel */}
                    <div className="bg-[#09080E] border border-[#1E1B29] rounded-xl p-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-zinc-400 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 uppercase font-semibold text-[10px]">Intento:</span>
                        <code className="text-[#d7baff] bg-[#7a32d4]/10 px-2 py-0.5 rounded font-mono text-[11px]">
                          {entry.result.reason || 'desconocido'}
                        </code>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 uppercase font-semibold text-[10px]">Acción:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            entry.result.action === 'reply'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : entry.result.action === 'handoff'
                              ? 'bg-purple-500/15 text-[#d7baff] border border-purple-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {entry.result.action}
                        </span>
                      </div>

                      {/* AI Understanding Metadata */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 uppercase font-semibold text-[10px]">IA:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            entry.result.aiUsed
                              ? 'bg-purple-500/15 text-[#d7baff] border border-purple-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {entry.result.aiUsed ? 'Usada' : 'No usada'}
                        </span>
                      </div>

                      {entry.result.aiUsed && entry.result.aiConfidence != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px]">Confianza:</span>
                          <span className="text-zinc-300 font-mono text-[11px]">
                            {entry.result.aiConfidence.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {state?.flow && state.flow !== 'none' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px]">Flujo:</span>
                          <span className="text-zinc-200 font-semibold uppercase text-[11px]">{state.flow}</span>
                        </div>
                      )}

                      {state?.awaitingField && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px]">Esperando:</span>
                          <span className="text-amber-300 font-mono text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            {state.awaitingField}
                          </span>
                        </div>
                      )}

                      {typeof entry.result.stockCount === 'number' && entry.result.stockCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px]">Stock:</span>
                          <span className="font-semibold text-zinc-200">
                            {entry.result.stockCount} unidad{entry.result.stockCount === 1 ? '' : 'es'}
                          </span>
                        </div>
                      )}

                      {entry.result.matchedModel && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px]">Modelo:</span>
                          <span className="font-semibold text-zinc-300">{entry.result.matchedModel}</span>
                        </div>
                      )}

                      {/* Collected Selling Details */}
                      {collectedDetails.length > 0 && (
                        <div className="w-full flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1C1826] mt-1">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px] mr-1">
                            Datos recogidos:
                          </span>
                          {collectedDetails.map((detail) => (
                            <span
                              key={detail}
                              className="bg-[#14121F] border border-[#2B243B] px-2 py-0.5 rounded text-[11px] text-zinc-300 font-medium"
                            >
                              {detail}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Collected Buying Preferences (Section 9) */}
                      {collectedPreferences.length > 0 && (
                        <div className="w-full flex flex-col gap-1.5 pt-2 border-t border-[#1C1826] mt-1">
                          <span className="text-zinc-500 uppercase font-semibold text-[10px]">
                            Preferencias:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {collectedPreferences.map((pref) => (
                              <span
                                key={pref}
                                className="bg-[#14121F] border border-[#2B243B] px-2 py-0.5 rounded text-[11px] text-zinc-300 font-medium"
                              >
                                {pref}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
