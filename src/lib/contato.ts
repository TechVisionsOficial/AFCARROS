export const WHATSAPP_NUMERO = "5511955556787";
export const INSTAGRAM_URL = "https://www.instagram.com/afcarros/";
export const FACEBOOK_URL = "https://www.facebook.com/108721888264769/";

export const ENDERECO = "Avenida Guapira, 1793";
export const CIDADE_UF = "São Paulo - SP";
export const ENDERECO_COMPLETO = `${ENDERECO}, ${CIDADE_UF}`;

export const HORARIOS = [
  { dias: "Segunda a Sexta", horario: "9h às 18h" },
  { dias: "Sábado", horario: "9h às 14h" },
];

// Ver a localização no mapa
export const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO_COMPLETO)}`;

// Traçar rota até a loja (abre o app no celular com a navegação)
export const GOOGLE_MAPS_ROTA_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ENDERECO_COMPLETO)}`;
export const WAZE_ROTA_URL = `https://www.waze.com/ul?q=${encodeURIComponent(ENDERECO_COMPLETO)}&navigate=yes`;

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}
