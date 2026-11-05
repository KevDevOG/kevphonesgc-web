import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'KevPhonesGC - Compra y vende iPhone en Gran Canaria'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  let logoDataUrl: string | null = null
  try {
    const logoBuffer = await readFile(join(process.cwd(), 'public/brand/kevphonesgc-logo.PNG'))
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch {
    logoDataUrl = null
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#050506',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(147, 51, 234, 0.28) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(168, 85, 247, 0.16) 0%, transparent 45%)',
        }}
      >
        {/* Top Header / Brand Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Logo KevPhonesGC"
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '26px',
                    borderRadius: '4px',
                    border: '3px solid #ffffff',
                    display: 'flex',
                  }}
                />
              </div>
            )}
            <span
              style={{
                fontSize: '34px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              KEVPHONES<span style={{ color: '#c084fc' }}>GC</span>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#c084fc',
              }}
            />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#e9d5ff',
                letterSpacing: '0.02em',
              }}
            >
              Gran Canaria
            </span>
          </div>
        </div>

        {/* Hero Title & Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '66px',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Compra y vende iPhone</span>
            <span
              style={{
                background: 'linear-gradient(to right, #c084fc, #e879f9)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              en Gran Canaria
            </span>
          </div>
          <p
            style={{
              fontSize: '25px',
              color: '#a1a1aa',
              margin: 0,
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            Stock revisado, valoración orientativa online y trato directo en mano.
          </p>
        </div>

        {/* Footer / Highlights Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#a855f7',
              letterSpacing: '0.01em',
            }}
          >
            kevphones.es
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              fontSize: '20px',
              color: '#71717a',
              fontWeight: 500,
            }}
          >
            <span>Stock disponible</span>
            <span>•</span>
            <span>Valoración online</span>
            <span>•</span>
            <span>Entrega local</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

