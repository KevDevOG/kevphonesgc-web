import { PublicHeader } from '@/components/public/PublicHeader'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Información sobre el uso de cookies en KevPhonesGC.',
  robots: {
    index: false,
    follow: true,
    noarchive: true
  }
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Política de cookies</h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Qué son las cookies</h2>
            <p className="text-zinc-400">
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo (ordenador, tablet o móvil) cuando los visitas. Se utilizan habitualmente para que los sitios web funcionen de manera eficiente y para proporcionar información de funcionamiento a los propietarios del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Cookies utilizadas actualmente</h2>
            <p className="text-zinc-400 mb-4">
              Actualmente, esta aplicación <strong className="text-white">NO</strong> utiliza de forma intencionada:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Cookies publicitarias o de marketing.</li>
              <li>Cookies de publicidad comportamental.</li>
              <li>Cookies analíticas o de medición (como Google Analytics).</li>
              <li>Píxeles de seguimiento (como Meta Pixel).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Cookies técnicas necesarias</h2>
            <p className="text-zinc-400 mb-4">
              La aplicación puede utilizar cookies técnicas estrictamente necesarias o mecanismos de almacenamiento equivalentes (como el almacenamiento local del navegador) para funciones como:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400 mb-4">
              <li>Seguridad de la aplicación.</li>
              <li>Gestión de la sesión del usuario.</li>
              <li>Autenticación segura del administrador.</li>
              <li>Funcionamiento esencial del sitio web.</li>
            </ul>
            <p className="text-zinc-400">
              Estas tecnologías estrictamente necesarias no requieren consentimiento explícito del usuario cuando se utilizan exclusivamente para estos fines técnicos imprescindibles. Se informan en esta política por razones de transparencia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Servicios y enlaces de terceros</h2>
            <p className="text-zinc-400">
              Nuestro sitio web puede contener enlaces a sitios externos, redes sociales o servicios de terceros. KevPhonesGC no tiene control sobre las políticas de cookies de estos terceros. Al acceder a dichos servicios, estarás sujeto a sus propias políticas de privacidad y cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cambios futuros</h2>
            <p className="text-zinc-400">
              Si en el futuro se incorporan cookies analíticas, publicitarias o cualquier otra cookie no esencial para el funcionamiento del sitio, se implementará el mecanismo de información y consentimiento requerido por la normativa vigente antes de proceder a su uso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cómo gestionar cookies desde el navegador</h2>
            <p className="text-zinc-400 mb-4">
              Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones de tu navegador web. A continuación, encontrarás los enlaces de soporte de los navegadores más comunes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Apple Safari</li>
              <li>Microsoft Edge</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
