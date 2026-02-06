import { ImageResponse } from 'next/og'
 
// Image metadata
export const alt = 'Panel AI - Realistic Mock Interview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
// Image generation
export default function Image() {
  return new ImageResponse(
    (
      // ImageResponse style object
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <svg 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            style={{ width: 120, height: 120 }}
          >
            <rect x="8" y="8" width="8" height="24" fill="#ffffff" />
            <rect x="20" y="8" width="4" height="24" fill="#ffffff" opacity="0.6" />
            <rect x="28" y="8" width="4" height="24" fill="#ffffff" opacity="0.3" />
          </svg>
        </div>
        <div
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-5px',
            marginBottom: '10px',
          }}
        >
          PANEL AI
        </div>
        <div
          style={{
            fontSize: 30,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '5px',
          }}
        >
          Realistic Mock Interview
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
