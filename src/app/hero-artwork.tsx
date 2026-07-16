export function HeroArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* linhas de velocidade, no mesmo motivo do logo */}
      <svg
        className="absolute -left-24 top-0 h-full w-1/2"
        style={{ opacity: 0.05 }}
        viewBox="0 0 300 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M40,0 L0,800 L60,800 L100,0 Z" fill="#141416" />
        <path d="M120,0 L80,800 L110,800 L150,0 Z" fill="#DA1F2B" />
        <path d="M170,0 L130,800 L150,800 L190,0 Z" fill="#141416" />
      </svg>
      <svg
        className="absolute -right-24 bottom-0 h-full w-1/2 rotate-180"
        style={{ opacity: 0.05 }}
        viewBox="0 0 300 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M40,0 L0,800 L60,800 L100,0 Z" fill="#141416" />
        <path d="M120,0 L80,800 L110,800 L150,0 Z" fill="#DA1F2B" />
        <path d="M170,0 L130,800 L150,800 L190,0 Z" fill="#141416" />
      </svg>
    </div>
  );
}
