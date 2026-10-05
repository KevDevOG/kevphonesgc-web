'use client'

import { useState } from 'react'
import IphoneQuoteFlow from './IphoneQuoteFlow'
import MacbookQuoteFlow, { MacbookModelData } from './MacbookQuoteFlow'

type Props = {
  iphoneModels: any[]
  macbookModels: MacbookModelData[]
  quoteMode?: 'sell' | 'trade_in'
  targetDevice?: any
}

export default function QuoteCategorySelector({ iphoneModels, macbookModels, quoteMode, targetDevice }: Props) {
  const [category, setCategory] = useState<'iphone' | 'macbook' | null>(null)

  if (!category) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10 lg:py-20 animate-quote-step-enter">
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-8 text-center">¿Qué dispositivo quieres valorar?</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
          <button 
            onClick={() => setCategory('iphone')}
            className="p-8 sm:p-10 bg-[#0B0B0E] border border-[#1F1F24] rounded-[24px] hover:border-purple-500/50 hover:bg-[#111114] transition-all text-center group active:scale-[0.98]"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-purple-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">iPhone</h2>
            <p className="text-zinc-400">Valora tu iPhone en pocos pasos</p>
          </button>
          
          <button 
            onClick={() => setCategory('macbook')}
            className="p-8 sm:p-10 bg-[#0B0B0E] border border-[#1F1F24] rounded-[24px] hover:border-purple-500/50 hover:bg-[#111114] transition-all text-center group active:scale-[0.98]"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 bg-purple-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="12" rx="2" ry="2" />
                <path d="M2 16h20" />
                <path d="M8 20h8" />
                <path d="M12 16v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">MacBook</h2>
            <p className="text-zinc-400">Configura técnicamente tu MacBook</p>
          </button>
        </div>
      </div>
    )
  }

  if (category === 'iphone') {
    return (
      <div className="animate-quote-step-enter relative">
        <div className="mb-4 lg:absolute lg:-top-12 lg:left-0">
          <button onClick={() => setCategory(null)} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>
        <IphoneQuoteFlow models={iphoneModels} quoteMode={quoteMode} targetDevice={targetDevice} />
      </div>
    )
  }

  if (category === 'macbook') {
    return (
      <div className="animate-quote-step-enter relative">
        <MacbookQuoteFlow models={macbookModels} onBackToCategory={() => setCategory(null)} />
      </div>
    )
  }
  
  return null
}
