import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 12) {
    console.error('Uso: npm run admin:create -- correo "clave de 12+ caracteres"');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL (usa npm run admin:create)");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const hash = await bcrypt.hash(password, 12);
  await sql`insert into admins (email, password_hash)
    values (${email.trim().toLowerCase()}, ${hash})
    on conflict (email) do update set password_hash = excluded.password_hash`;
  console.log("Super-admin listo:", email);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
