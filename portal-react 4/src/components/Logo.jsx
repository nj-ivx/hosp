let uid = 0
export default function Logo() {
  const gradId = `logoGrad${uid++}`
  return (
    <span className="brand-logo" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="8" fill={`url(#${gradId})`} />
        <path d="M14 7v14M7 14h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="28" y2="28">
            <stop stopColor="#0B5D66" />
            <stop offset="1" stopColor="#2FBFA0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}
