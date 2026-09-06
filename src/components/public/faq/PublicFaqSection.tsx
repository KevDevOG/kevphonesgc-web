'use client'

import { useState } from 'react'

const faqItems = [
  {
    question: "¿Los dispositivos están revisados?",
    answer: "Sí. Antes de publicar un dispositivo comprobamos su funcionamiento y mostramos de forma clara su estado, batería, accesorios y demás información disponible."
  },
  {
    question: "¿Dónde realizáis las entregas?",
    answer: "Trabajamos en Canarias. Las entregas en mano se coordinan principalmente en Gran Canaria y podemos valorar entregas o envíos al resto de islas según cada operación."
  },
  {
    question: "¿Cómo funciona la tasación de mi iPhone?",
    answer: "Puedes completar nuestra tasación online indicando el modelo, capacidad, batería y estado del dispositivo. Obtendrás una valoración orientativa y la cantidad definitiva se confirma después de revisar físicamente el iPhone."
  },
  {
    question: "¿Puedo vender mi iPhone directamente?",
    answer: "Sí. Puedes enviarnos una solicitud de venta con los datos y fotografías del dispositivo. Revisaremos la información y nos pondremos en contacto contigo para continuar con la operación."
  },
  {
    question: "¿Puedo entregar mi iPhone como parte de pago?",
    answer: "Sí. En los dispositivos disponibles puedes seleccionar la opción de parte de pago, valorar tu iPhone y conocer aproximadamente la diferencia entre ambos dispositivos. La operación final se confirma después de revisar el teléfono."
  },
  {
    question: "¿El precio que aparece en el catálogo es el precio final?",
    answer: "El precio mostrado corresponde al dispositivo. Si una operación requiere envío u otro servicio adicional, se acordará previamente antes de cerrar la compra."
  },
  {
    question: "¿Los dispositivos tienen garantía?",
    answer: "Cuando un dispositivo conserva garantía oficial vigente, lo indicamos en su ficha. KevPhonesGC no añade una garantía propia adicional en esta versión del servicio."
  },
  {
    question: "¿Cómo puedo contactar con KevPhonesGC?",
    answer: "En los dispositivos disponibles encontrarás un botón para consultar directamente por WhatsApp. También puedes iniciar una tasación o enviar una solicitud de venta desde la web."
  }
]

export function PublicFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Preguntas frecuentes
        </h2>
        <p className="text-lg text-zinc-400 font-light">
          Resolvemos las dudas más habituales sobre compra, venta y tasación.
        </p>
      </div>

      <div className="space-y-4">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index
          const contentId = `faq-content-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div 
              key={index}
              className={`bg-[#0B0B0E] border ${isOpen ? 'border-purple-500/30' : 'border-[#1F1F24]'} rounded-[20px] overflow-hidden transition-colors duration-300`}
            >
              <button
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-6 sm:p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-[20px]"
              >
                <span className="text-white font-medium text-lg pr-4">{item.question}</span>
                <span 
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white bg-[#1F1F24]' : 'bg-transparent'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              <div 
                id={contentId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <p className="p-6 sm:p-8 pt-0 sm:pt-0 text-zinc-400 leading-relaxed font-light">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
