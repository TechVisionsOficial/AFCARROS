import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados a todas as respostas.
// CSP: apenas recursos da própria origem. 'unsafe-inline'/'unsafe-eval' em
// script-src são exigidos pelo runtime do Next; mesmo assim bloqueamos scripts
// de origens externas, iframes (frame-ancestors) e reduzimos a superfície.
const CSP = [
  "default-src 'self'",
  // `blob:` é o esquema blob: do navegador. O domínio do Vercel Blob é outro e
  // precisa ser liberado à parte, senão as fotos dos veículos não carregam.
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Fotos dos veículos ficam no Vercel Blob em produção. Sem isso o
      // next/image recusa a URL e as fotos não aparecem.
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
