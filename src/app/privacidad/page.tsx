import { PublicHeader } from '@/components/public/PublicHeader'
import Link from 'next/link'

export default function PrivacidadPage() {
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

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Política de privacidad</h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Responsable del tratamiento</h2>
            <p className="text-zinc-400 mb-4">
              La presente política rige el tratamiento de datos personales por parte de KevPhonesGC / propietario del sitio web:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-300">Titular:</strong> PENDIENTE_NOMBRE_TITULAR</li>
              <li><strong className="text-zinc-300">NIF/NIE:</strong> PENDIENTE_NIF_NIE</li>
              <li><strong className="text-zinc-300">Domicilio:</strong> PENDIENTE_DOMICILIO_LEGAL</li>
              <li><strong className="text-zinc-300">Email:</strong> PENDIENTE_EMAIL_CONTACTO</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Datos personales que tratamos</h2>
            <p className="text-zinc-400 mb-4">
              Recopilamos los datos estrictamente necesarios para prestar nuestros servicios. Esto puede incluir:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Nombre y apellidos.</li>
              <li>Número de teléfono de contacto.</li>
              <li>Ubicación (suministrada por el usuario para la gestión logística).</li>
              <li>Información de los dispositivos sobre los que se consulta (modelo, estado, capacidad).</li>
              <li>Fotografías de los dispositivos enviadas en las solicitudes de venta.</li>
              <li>Información y detalles relativos a cotizaciones o solicitudes.</li>
              <li>Mensajes o consultas enviadas voluntariamente por el usuario.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Finalidad del tratamiento</h2>
            <p className="text-zinc-400 mb-4">
              Los datos recabados se utilizan para las siguientes finalidades:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Gestionar solicitudes de cotización.</li>
              <li>Gestionar solicitudes de venta de dispositivos.</li>
              <li>Contactar con los usuarios interesados para coordinar operaciones.</li>
              <li>Gestionar posibles operaciones de compra, venta o entrega como parte de pago.</li>
              <li>Responder a consultas o dudas enviadas por los usuarios.</li>
              <li>Mantener registros operativos y de seguridad del sitio web cuando sea necesario.</li>
            </ul>
            <p className="text-zinc-400 mt-4">
              Las fotografías subidas durante una solicitud de venta son utilizadas exclusivamente para evaluar el dispositivo y gestionar dicha solicitud u operación.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Base legal del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong>Medidas precontractuales:</strong> Cuando el usuario solicita una cotización, una venta o un contacto.</li>
              <li><strong>Obligaciones legales:</strong> Cumplimiento de obligaciones legales aplicables cuando corresponda.</li>
              <li><strong>Interés legítimo:</strong> Aquellos estrictamente necesarios para el correcto funcionamiento del servicio y la seguridad del sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Plazo de conservación</h2>
            <p className="text-zinc-400">
              Los datos se conservarán durante el tiempo necesario para gestionar la solicitud u operación y, cuando corresponda, durante los plazos exigidos por las obligaciones legales aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Destinatarios de los datos</h2>
            <p className="text-zinc-400 font-medium mb-4">No vendemos tus datos personales.</p>
            <p className="text-zinc-400">
              Tus datos podrán ser tratados por proveedores tecnológicos y de servicios estrictamente necesarios para el alojamiento, bases de datos, almacenamiento y operación del sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Transferencias internacionales</h2>
            <p className="text-zinc-400">
              Si un proveedor tecnológico procesa los datos fuera del Espacio Económico Europeo, se asegurará la aplicación de las salvaguardias legales adecuadas y requeridas por la normativa aplicable en materia de protección de datos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Derechos del usuario</h2>
            <p className="text-zinc-400 mb-4">
              Puedes ejercer tus derechos sobre tus datos personales enviando un correo a <strong className="text-zinc-300">PENDIENTE_EMAIL_CONTACTO</strong>. Tus derechos incluyen:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400 mb-4">
              <li><strong>Acceso:</strong> Conocer qué datos personales estamos tratando.</li>
              <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos.</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos.</li>
              <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
              <li><strong>Limitación:</strong> Solicitar la restricción del tratamiento.</li>
              <li><strong>Portabilidad:</strong> Solicitar tus datos en un formato estructurado (cuando sea aplicable).</li>
            </ul>
            <p className="text-zinc-400">
              También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) si consideras que tus derechos han sido vulnerados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Seguridad de los datos</h2>
            <p className="text-zinc-400">
              Implementamos medidas técnicas y organizativas razonables para proteger tus datos contra el acceso no autorizado, la pérdida o la alteración indebida, garantizando la integridad de la información que tratamos.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
