import { PublicHeader } from '@/components/public/PublicHeader'
import Link from 'next/link'

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-xl mb-12">
          <p className="text-yellow-400 font-medium text-center">Documento pendiente de completar antes de la publicación definitiva.</p>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Aviso legal</h1>
        <p className="text-lg text-zinc-400 mb-12">Este sitio web opera bajo el nombre comercial KevPhonesGC.</p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Identificación del titular</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-300">Nombre comercial:</strong> KevPhonesGC</li>
              <li><strong className="text-zinc-300">Titular:</strong> PENDIENTE_NOMBRE_TITULAR</li>
              <li><strong className="text-zinc-300">NIF/NIE:</strong> PENDIENTE_NIF_NIE</li>
              <li><strong className="text-zinc-300">Domicilio a efectos legales:</strong> PENDIENTE_DOMICILIO_LEGAL</li>
              <li><strong className="text-zinc-300">Correo electrónico:</strong> PENDIENTE_EMAIL_CONTACTO</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Objeto del sitio web</h2>
            <p className="text-zinc-400 mb-4">
              El sitio web proporciona información sobre dispositivos disponibles y permite a los usuarios solicitar cotizaciones, enviar solicitudes de venta de dispositivos, contactar con KevPhonesGC e iniciar posibles operaciones de entrega como parte de pago.
            </p>
            <p className="text-zinc-400">
              La información del sitio web no formaliza por sí misma una compra o venta. Las cotizaciones son orientativas hasta la revisión física del dispositivo y la disponibilidad del catálogo puede cambiar sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Condiciones de uso</h2>
            <p className="text-zinc-400">
              El uso del sitio web implica la aceptación de este aviso legal. El usuario se compromete a hacer un uso adecuado y lícito del sitio web y de sus contenidos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Propiedad intelectual</h2>
            <p className="text-zinc-400">
              Todos los contenidos del sitio web, incluyendo textos, fotografías, logotipos y diseño, están protegidos por la normativa de propiedad intelectual aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Enlaces externos</h2>
            <p className="text-zinc-400">
              Este sitio web puede contener enlaces a sitios externos. Las políticas y condiciones de dichos enlaces externos se rigen por servicios de terceros, sobre los cuales KevPhonesGC no tiene control ni asume responsabilidad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Responsabilidad</h2>
            <p className="text-zinc-400">
              KevPhonesGC no se responsabiliza de los posibles errores u omisiones en el contenido, ni de los daños que puedan derivarse del uso del sitio web. Las garantías u otras obligaciones contractuales se acordarán de forma particular antes de finalizar cualquier operación.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Legislación aplicable</h2>
            <p className="text-zinc-400">
              La relación entre KevPhonesGC y el usuario se rige por la normativa española vigente y cualquier controversia se someterá a los juzgados y tribunales competentes.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
