import { randomBytes, randomInt } from "node:crypto";

// Sin 0, O, 1, I para evitar confusiones al dictar o copiar
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código corto del comercio (lo usan los cajeros junto con su PIN). Ej: K7F2QX */
export function generateCommerceCode(size = 6): string {
  let out = "";
  for (let i = 0; i < size; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Token secreto para las URLs de webhook / reenvío de correos de cada comercio */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function randomOperationId(): string {
  let out = "9";
  for (let i = 0; i < 11; i++) out += randomInt(10);
  return out;
}
