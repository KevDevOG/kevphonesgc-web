'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

type QuoteResultProps = {
  result: {
    estimatedMin: number
    estimatedMax: number
    differenceMin?: number
    differenceMax?: number
    direction?: 'customer_pays' | 'kevphones_pays' | 'mixed' | 'equal'
  }
  quoteMode?: 'sell' | 'trade_in'
  deviceSummary?: ReactNode
  onReset: () => void
  onContinue: () => void
}

export default function QuoteResultCard({ result, quoteMode = 'sell', onReset, onContinue, deviceSummary }: QuoteResultProps) {
  const isTradeIn = quoteMode === 'trade_in'
  
  return (
    <div className="kevphones-valuation-result bg-[#0B0B0E] border border-[#1F1F24] rounded-[24px] p-6 sm:p-10 w-full animate-quote-step-enter relative overflow-hidden">
      <div className="kevphones-valuation-result__valuation">
        <h2 className="kevphones-valuation-result__label">
          Tu valoración estimada
        </h2>
        <div className="kevphones-valuation-result__amount text-4xl sm:text-6xl font-bold tracking-tight text-white mb-2">
          {result.estimatedMin} € – {result.estimatedMax} €
        </div>
        <p className="kevphones-valuation-result__status">Valor orientativo</p>
      </div>

      {isTradeIn && result.direction && (
        <div className="relative z-10 text-center mb-10 p-6 sm:p-8 bg-[#050506] border border-purple-500/20 rounded-[20px] shadow-[0_0_30px_rgba(147,51,234,0.05)]">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">
            {result.direction === 'customer_pays' && 'Diferencia estimada a pagar'}
            {result.direction === 'kevphones_pays' && 'Diferencia estimada a tu favor'}
            {(result.direction === 'mixed' || result.direction === 'equal') && 'Diferencia prácticamente compensada'}
          </h2>
          
          <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            {result.direction === 'kevphones_pays' ? (
              `${Math.abs(result.differenceMax!)} € – ${Math.abs(result.differenceMin!)} €`
            ) : (
              `${result.differenceMin} € – ${result.differenceMax} €`
            )}
          </div>
          
          <p className="text-zinc-500 text-xs sm:text-sm font-light">
            {result.direction === 'customer_pays' && 'Esta sería aproximadamente la cantidad que tendrías que añadir.'}
            {result.direction === 'kevphones_pays' && 'El valor estimado de tu iPhone supera el precio del dispositivo seleccionado.'}
            {(result.direction === 'mixed' || result.direction === 'equal') && 'Según la revisión final, la operación podría quedar compensada o existir una pequeña diferencia a favor de una de las partes.'}
          </p>
        </div>
      )}

      <div className="kevphones-valuation-result__explanation">
        <p className="text-zinc-400 text-sm font-light mb-3">
          {isTradeIn 
            ? 'Esta valoración es orientativa. El valor definitivo se confirmará después de revisar físicamente tu iPhone.'
            : 'Esta valoración es orientativa. El importe definitivo se confirmará después de revisar físicamente el dispositivo.'}
        </p>
        <p className="text-zinc-600 text-xs">
          {isTradeIn 
            ? 'La diferencia final puede variar si el estado real no coincide con la información indicada.'
            : 'El valor máximo supone que el estado real coincide con la información indicada.'}
        </p>
      </div>

      {deviceSummary && <div className="kevphones-valuation-result__summary">{deviceSummary}</div>}
      <div className="kevphones-valuation-result__continuation">
        <h3>{isTradeIn ? 'Continúa con la revisión' : '¿Quieres continuar con la venta?'}</h3>
        <p>Continúa con los datos y fotos del dispositivo para enviar tu solicitud. La valoración final se confirma tras la revisión física.</p>
      </div>

      <div className="kevphones-valuation-result__actions">
        <button type="button" onClick={onContinue} className="kevphones-valuation-result__primary">
          {isTradeIn ? 'Solicitar revisión' : 'Continuar con mi solicitud'}
        </button>
        <button type="button" onClick={onReset} className="kevphones-valuation-result__secondary">
          Hacer otra tasación
        </button>
      </div>

      {isTradeIn && (
        <div className="mt-6 text-center">
          <Link 
            href="/#stock" 
            className="inline-block text-zinc-500 hover:text-white font-medium text-xs tracking-wide uppercase transition-colors"
          >
            Cambiar dispositivo
          </Link>
        </div>
      )}
    </div>
  )
}
