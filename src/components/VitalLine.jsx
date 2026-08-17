import React from 'react'

export default function VitalLine() {
  return (
    <div
      style={{
        width: '100%',
        height: '2px',
        background: 'var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
          animation: 'vitalSlide 3.5s ease-in-out infinite',
          opacity: 0.8
        }}
      />
      <style>{`
        @keyframes vitalSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
