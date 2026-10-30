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
    <section className="kevphones-lower-section kevphones-faq" aria-labelledby="faq-title">
      <div className="kevphones-lower-heading">
        <h2 id="faq-title" className="kevphones-lower-title">Preguntas frecuentes</h2>
        <p>Resolvemos las dudas más habituales sobre compra, venta y tasación.</p>
      </div>

      <div className="kevphones-faq__items">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index
          const contentId = `faq-content-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div key={index} className="kevphones-faq__item" data-open={isOpen}>
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleItem(index)}
                >
                  <span>{item.question}</span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? 'M6 12h12' : 'M6 12h12M12 6v12'} />
                  </svg>
                </button>
              </h3>
              <div id={contentId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
                <p>{item.answer}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
