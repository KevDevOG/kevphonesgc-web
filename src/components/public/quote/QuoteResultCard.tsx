'use client'

import Link from 'next/link'

type QuoteResultProps = {
  result: {
    estimatedMin: number
    estimatedMax: number
    differenceMin?: number
    differenceMax?: number
    direction?: 'customer_pays' | 'kevphones_pays' | 'mixed' | 'equal'
  }
  quoteMode?: 'sell' | 'trade_in'
  onReset: () => void
  onContinue: () => void
}

export default function QuoteResultCard({ result, quoteMode = 'sell', onReset, onContinue }: QuoteResultProps) {
  const isTradeIn = quoteMode === 'trade_in'
  
  return (
    <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-[24px] p-6 sm:p-10 w-full animate-quote-step-enter relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 inset-x-0 h-32 bg-purple-900/10 blur-[60px] rounded-full scale-110 pointer-events-none"></div>

      <div className="relative z-10 text-center mb-10">
        <h2 className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-4">
          {isTradeIn ? 'Valor estimado de tu iPhone' : 'Precio orientativo'}
        </h2>
        <div className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-2">
          {result.estimatedMin} € – {result.estimatedMax} €
        </div>
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

      <div className="relative z-10 text-center mb-10 max-w-lg mx-auto">
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

      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button
          onClick={onReset}
          className="order-2 sm:order-1 flex-1 px-8 py-4 bg-[#050506] hover:bg-[#111114] border border-[#1F1F24] text-zinc-300 font-medium rounded-xl transition-colors active:scale-[0.98]"
        >
          Hacer otra tasación
        </button>
        <button 
          onClick={onContinue}
          className="order-1 sm:order-2 flex-1 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.15)] active:scale-[0.98]"
        >
          {isTradeIn ? 'Solicitar revisión' : 'Quiero vender mi iPhone'}
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
