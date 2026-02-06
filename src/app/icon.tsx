import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse style object
      <div
        style={{
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ width: 32, height: 32 }}
        >
          <rect x="8" y="8" width="8" height="24" fill="#0f172a" />
          <rect x="20" y="8" width="4" height="24" fill="#0f172a" opacity="0.6" />
          <rect x="28" y="8" width="4" height="24" fill="#0f172a" opacity="0.3" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
