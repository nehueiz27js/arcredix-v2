import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "ARCREDIX | Validá tus cobros. Evitá estafas.",
  description:
    "ARCREDIX te ayuda a validar tus cobros, prevenir estafas y controlar las operaciones de tu comercio desde un solo lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body>
        <div className={`${sora.className} min-h-screen bg-[#050B12] text-white antialiased`}>{children}</div>
      </body>
    </html>
  );
}
