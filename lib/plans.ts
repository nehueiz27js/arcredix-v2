export type PlanId = "starter" | "pro" | "enterprise" | "lifetime";

export type Plan = {
  name: string;
  priceMonthly: number | null; // USD por mes (null = pago único)
  setup: number; // USD (en lifetime es el pago único)
  cajas: number; // cajas / PINs de cajero máximos
  accounts: number; // alias / CVU / bancos vinculados
  ocr: boolean; // escáner por cámara habilitado
  historyDays: number | null; // null = ilimitado
};

export const PLANS: Record<PlanId, Plan> = {
  starter: { name: "Starter Mostrador", priceMonthly: 15, setup: 30, cajas: 1, accounts: 1, ocr: false, historyDays: 30 },
  pro: { name: "Comercio Pro", priceMonthly: 29, setup: 50, cajas: 4, accounts: 3, ocr: true, historyDays: null },
  enterprise: { name: "Empresa & Distribución", priceMonthly: 55, setup: 90, cajas: 999, accounts: 999, ocr: true, historyDays: null },
  lifetime: { name: "Licencia Propia", priceMonthly: null, setup: 390, cajas: 4, accounts: 3, ocr: true, historyDays: null },
};

export function isPlanId(x: string): x is PlanId {
  return x in PLANS;
}
