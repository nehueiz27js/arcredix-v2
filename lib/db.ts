import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL en .env.local (o en las variables de Vercel)");

// Uso: const rows = await sql`select * from commerces where id = ${id}`;
export const sql = neon(url);
