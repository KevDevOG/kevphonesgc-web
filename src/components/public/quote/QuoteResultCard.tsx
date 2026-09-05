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
    <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-6 md:p-8 w-full max-w-xl mx-auto shadow-2xl">
      <div className="text-center mb-6">
        <h2 className={`text-xl text-zinc-300 mb-2 ${isTradeIn ? 'text-sm uppercase tracking-widest text-[#6E6E78] font-bold' : ''}`}>
          {isTradeIn ? 'Valor estimado de tu iPhone' : 'Valoración estimada'}
        </h2>
        <div className={`font-bold tracking-tight mb-4 text-purple-400 ${isTradeIn ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl text-white'}`}>
          {result.estimatedMin} € – {result.estimatedMax} €
        </div>
      </div>

      {isTradeIn && result.direction && (
        <div className="text-center mb-8 p-6 bg-[#9867db]/10 border border-[#9867db]/30 rounded-2xl">
          <h2 className="text-xl text-white font-medium mb-2">
            {result.direction === 'customer_pays' && 'Diferencia estimada a pagar'}
            {result.direction === 'kevphones_pays' && 'Diferencia estimada a tu favor'}
            {(result.direction === 'mixed' || result.direction === 'equal') && 'Diferencia prácticamente compensada'}
          </h2>
          
          <div className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            {result.direction === 'kevphones_pays' ? (
              `${Math.abs(result.differenceMax!)} € – ${Math.abs(result.differenceMin!)} €`
            ) : (
              `${result.differenceMin} € – ${result.differenceMax} €`
            )}
          </div>
          
          <p className="text-zinc-300 text-sm">
            {result.direction === 'customer_pays' && 'Esta sería aproximadamente la cantidad que tendrías que añadir.'}
            {result.direction === 'kevphones_pays' && 'El valor estimado de tu iPhone supera el precio del dispositivo seleccionado.'}
            {(result.direction === 'mixed' || result.direction === 'equal') && 'Según la revisión final, la operación podría quedar compensada o existir una pequeña diferencia a favor de una de las partes.'}
          </p>
        </div>
      )}

      <div className="text-center mb-8">
        <p className="text-zinc-400 text-sm mb-2">
          {isTradeIn 
            ? 'Esta valoración es orientativa. El valor definitivo se confirmará después de revisar físicamente tu iPhone.'
            : 'Esta valoración es orientativa. El importe definitivo se confirmará después de revisar físicamente el dispositivo.'}
        </p>
        <p className="text-zinc-500 text-xs">
          {isTradeIn 
            ? 'La diferencia final puede variar si el estado real no coincide con la información indicada.'
            : 'El valor máximo supone que el estado real coincide con la información indicada.'}
        </p>
      </div>

      <div className="space-y-3">
        <button 
          onClick={onContinue}
          className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl text-center transition-colors"
        >
          {isTradeIn ? 'Solicitar revisión' : 'Quiero vender mi iPhone'}
        </button>
        <button
          onClick={onReset}
          className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-4 px-6 rounded-xl text-center transition-colors"
        >
          Calcular otro iPhone
        </button>
        {isTradeIn && (
          <Link 
            href="/#stock" 
            className="block w-full mt-4 text-zinc-500 hover:text-zinc-400 font-medium text-sm text-center transition-colors"
          >
            Cambiar dispositivo
          </Link>
        )}
      </div>
    </div>
  )
}
