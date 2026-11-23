export function money(n: number | string) {
  return Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
}

export function dateTime(d: string | Date) {
  return new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}
