import { neon } from "@neondatabase/serverless";
import { statements } from "./schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL. Usa: npm run db:setup");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  for (const s of statements) await sql.query(s);
  console.log("Tablas listas: admins, commerces, accounts, cashiers, payments, login_attempts");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
