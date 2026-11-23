"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  ["Cómo funciona", "#como-funciona"],
  ["Funciones", "#funciones"],
  ["QR y cajas", "#qr-cajas"],
  ["Planes", "#planes"],
  ["Preguntas frecuentes", "#faq"],
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050B12]/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="ARCREDIX inicio" onClick={close}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-7 text-sm text-[#A7B4C3] lg:flex">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="transition-colors hover:text-white">{label}</a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40">
            Ingresar
          </Link>
          <a href="#planes" className="rounded-lg bg-[#00D6A0] px-4 py-2 text-sm font-semibold text-[#050B12] transition-colors hover:bg-[#20E6C0]">
            Ver planes
          </a>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/20 p-2 lg:hidden"
        >
          <span className="block h-0.5 w-5 bg-white" />
          <span className="mt-1 block h-0.5 w-5 bg-white" />
          <span className="mt-1 block h-0.5 w-5 bg-white" />
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-[#050B12]/95 px-4 pb-5 lg:hidden">
          <ul className="space-y-1 py-3 text-[#A7B4C3]">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a href={href} onClick={close} className="block rounded-lg px-2 py-2.5 hover:bg-white/5 hover:text-white">{label}</a>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Link href="/login" onClick={close} className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 text-center text-white">Ingresar</Link>
            <a href="#planes" onClick={close} className="flex-1 rounded-lg bg-[#00D6A0] px-4 py-2.5 text-center font-semibold text-[#050B12]">Ver planes</a>
          </div>
        </div>
      )}
    </header>
  );
}
