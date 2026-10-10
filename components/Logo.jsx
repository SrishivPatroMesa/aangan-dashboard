// Aangan means courtyard: a building plan with an open centre.
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#24342E" />
      <rect x="6" y="6" width="20" height="20" rx="3" fill="none" stroke="#9FD2B5" strokeWidth="2.4" />
      <rect x="12" y="12" width="8" height="8" rx="1.5" fill="#E7C46C" />
      <path d="M16 6v3M16 23v3M6 16h3M23 16h3" stroke="#9FD2B5" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
