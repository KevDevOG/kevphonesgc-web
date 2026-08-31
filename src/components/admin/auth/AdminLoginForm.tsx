'use client'

import { useActionState, useState } from 'react'
import { signInAction } from '@/actions/auth'

const initialState = {
  error: ''
}

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full max-w-md bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-8 shadow-2xl relative">
      <div className="text-center mb-8 flex flex-col items-center">
        <span className="material-symbols-outlined text-[#d7baff] text-[48px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
          admin_panel_settings
        </span>
        <h1 className="font-bold text-4xl text-[#F7F7F7] uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Panel de administración
        </h1>
        <p className="text-[#A8A8B0] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Accede para gestionar KevPhonesGC.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider" htmlFor="email">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8B0]">
              mail
            </span>
            <input
              className="w-full bg-[#101014] border border-[#1F1F24] rounded text-[#F7F7F7] pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#d7baff]/20 focus:border-[#d7baff] transition-all"
              id="email"
              name="email"
              placeholder="tu@email.com"
              required
              type="email"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider" htmlFor="password">
              Contraseña
            </label>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8B0]">
              lock
            </span>
            <input
              className="w-full bg-[#101014] border border-[#1F1F24] rounded text-[#F7F7F7] pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-[#d7baff]/20 focus:border-[#d7baff] transition-all"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A8B0] hover:text-[#d7baff] transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              <span className="material-symbols-outlined">
                {showPassword ? "visibility" : "visibility_off"}
              </span>
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="text-[#ffb4ab] text-sm text-center font-medium">
            {state.error}
          </div>
        )}

        <div className="pt-2">
          <button
            className="w-full text-[#440087] font-bold py-3 rounded transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[#d7baff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending}
            style={{ background: 'linear-gradient(135deg, #d7baff 0%, #B98AFF 100%)' }}
            type="submit"
          >
            {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <a className="inline-flex items-center gap-2 text-sm font-semibold text-[#A8A8B0] hover:text-[#d7baff] transition-colors duration-200" href="/">
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Volver a la web
        </a>
      </div>
    </div>
  )
}
