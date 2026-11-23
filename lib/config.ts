// Número de WhatsApp para los botones de compra (formato internacional sin +, ej: 5492230000000)
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

export function buyLink(plan: string) {
  const text = encodeURIComponent(`Hola! Quiero contratar ARCREDIX - ${plan}`);
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${text}` : "/login";
}
