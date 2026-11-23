import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { buyLink } from "@/lib/config";
import { Navbar } from "@/components/landing/Navbar";
import { Logo } from "@/components/landing/Logo";
import { Reveal } from "@/components/landing/Reveal";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Faq } from "@/components/landing/Faq";

const G = "text-[#00D6A0]";
const card =
  "rounded-2xl border border-white/10 bg-[#0A131D] p-6 transition-all duration-300 hover:border-[#00D6A0]/40 hover:shadow-[0_0_40px_-12px_rgba(0,214,160,0.45)]";
const h2 = "text-3xl font-extrabold sm:text-4xl";

const PROBLEMS = [
  ["Comprobantes falsos", "Capturas editadas que parecen reales y se entregan sin que el dinero haya entrado."],
  ["Pagos pendientes o inexistentes", "El cliente muestra una transferencia que todavía no se acreditó o que nunca existió."],
  ["Errores al verificar transferencias", "Revisar la app del banco en plena venta lleva a confundir montos, nombres o fechas."],
  ["Pérdida de tiempo en controles manuales", "Cada verificación detiene la fila y distrae a quien atiende."],
];

const STEPS = [
  ["El comercio recibe una operación", "El cliente transfiere al alias o CVU del local."],
  ["Se verifica la información del cobro", "ARCREDIX toma la confirmación de tu banco o billetera, no la captura del cliente."],
  ["ARCREDIX permite consultar el estado", "En caja ves el cobro al instante, con aviso por voz, o lo buscás por número de operación."],
  ["El comercio decide con mayor seguridad", "Al validar y entregar, el comprobante queda usado y no puede repetirse."],
];

const FEATURES = [
  ["Validación de cobros", "Cada transferencia se confirma contra la fuente real y queda registrada como disponible o validada.", false],
  ["QR de operaciones", "Un código QR para el punto de cobro de tu comercio.", true],
  ["Gestión de cajas", "Cada cajero entra con su PIN y ve solo lo que necesita para cobrar.", false],
  ["Control de comercios", "Altas, planes, vencimientos y suspensión desde un panel central.", false],
  ["Usuarios y permisos", "Dueño y cajeros con permisos distintos: sin saldos ni reportes en el mostrador.", false],
  ["Historial de operaciones", "Todos tus comprobantes en un lugar, exportables a Excel.", false],
  ["Integraciones con proveedores de pago", "Mercado Pago y notificaciones por correo de tu banco.", false],
  ["Panel de administración", "Métricas y control de todos los comercios en un solo lugar.", false],
] as const;

const PLAN_UI = {
  starter: {
    desc: "Para comercios con una sola caja.",
    features: ["1 usuario dueño + 1 vista de caja", "1 billetera o banco vinculado", "Aviso automático por voz en vivo", "Bloqueo anti-doble uso", "Historial de 30 días"],
  },
  pro: {
    desc: "Para comercios con varios puntos de cobro.",
    features: ["Dueño + hasta 4 cajas con PIN", "Hasta 3 bancos, billeteras o alias", "Historial ilimitado y exportación a Excel", "Escáner de comprobantes por cámara (próximamente)"],
  },
  enterprise: {
    desc: "Para distribuidoras, corralones y cadenas con sucursales.",
    features: ["Cajas y usuarios ilimitados", "Múltiples sucursales y cuentas", "Alertas de anomalías y auditoría por cajero", "Soporte prioritario por WhatsApp"],
  },
} as const;

const FAQ = [
  { q: "¿Qué es ARCREDIX?", a: "Es una plataforma para validar los cobros de tu comercio, prevenir estafas con comprobantes falsos y controlar las operaciones desde un solo lugar." },
  { q: "¿Cómo funciona la validación?", a: "ARCREDIX no se basa en la captura del cliente: registra la confirmación real que emite tu banco o billetera. En caja ves el cobro con aviso por voz y, al validarlo, ese comprobante queda usado y no puede repetirse." },
  { q: "¿Cómo contrato un plan?", a: "Elegí tu plan en esta página y escribinos desde el botón de contratación. Damos de alta tu comercio y te enviamos tus accesos." },
  { q: "¿Qué necesita mi comercio para empezar?", a: "Una cuenta que reciba transferencias (alias o CVU), acceso a las notificaciones de esa cuenta (Mercado Pago o correos de tu banco) y un dispositivo con navegador en la caja. La compatibilidad con cada banco depende de las notificaciones que envíe; la verificamos con vos al comenzar." },
  { q: "¿Cómo ingreso a la plataforma?", a: "Los dueños ingresan desde el botón “Ingresar” con su email y contraseña. Los cajeros entran a la caja con el código de su comercio y su PIN de 4 dígitos." },
  { q: "¿Qué incluye cada plan?", a: "Starter cubre una caja y una cuenta. Comercio Pro suma hasta 4 cajas, 3 cuentas e historial ilimitado. Empresa no tiene límite de cajas, cuentas ni sucursales. Mirá el detalle en la sección Planes." },
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 50% at 72% 35%, rgba(0,214,160,0.16), transparent 70%)" }} aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              No entregues tu producto <span className="bg-gradient-to-r from-[#00D6A0] to-[#20E6C0] bg-clip-text text-transparent">sin confirmar tu dinero.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#A7B4C3]">
              ARCREDIX te ayuda a validar tus cobros, prevenir estafas y controlar las operaciones de tu comercio desde un solo lugar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#como-funciona" className="rounded-lg bg-[#00D6A0] px-6 py-3 text-center font-semibold text-[#050B12] transition-colors hover:bg-[#20E6C0]">Ver cómo funciona</a>
              <a href="#planes" className="rounded-lg border border-white/20 px-6 py-3 text-center transition-colors hover:border-white/40">Conocer los planes</a>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      {/* 2. EL PROBLEMA */}
      <section id="problema" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <Reveal>
          <h2 className={`${h2} text-center`}>Una captura <span className={G}>no confirma</span> un pago.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#A7B4C3]">
            Confiar únicamente en el comprobante que te muestra el cliente deja a tu comercio expuesto a estos riesgos.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 80}>
              <div className={`${card} h-full`}>
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-300">!</span>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-[#A7B4C3]">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. LA SOLUCIÓN */}
      <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <Reveal>
          <h2 className={`${h2} text-center`}>Validá. Confirmá. <span className={G}>Entregá.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#A7B4C3]">ARCREDIX pone la confirmación real del dinero a un toque de distancia del mostrador.</p>
        </Reveal>
        <div className="relative mt-12 grid gap-4 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-[34px] hidden h-px bg-gradient-to-r from-[#00D6A0]/0 via-[#00D6A0]/60 to-[#00D6A0]/0 lg:block" aria-hidden />
          {STEPS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 100}>
              <div className={`${card} relative h-full text-center`}>
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00D6A0] to-[#20E6C0] text-lg font-extrabold text-[#050B12]">{i + 1}</span>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-[#A7B4C3]">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. DEMOSTRACIÓN INTERACTIVA */}
      <section id="qr-cajas" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <Reveal>
          <h2 className={`${h2} text-center`}>Conocé ARCREDIX <span className={G}>en acción.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#A7B4C3]">Probá cómo se ve un cobro en caja: simulá una transferencia, validala y verificá un comprobante repetido o falso. Sin registrarte.</p>
        </Reveal>
        <Reveal className="mt-10">
          <LiveDemo />
        </Reveal>
      </section>

      {/* 5. FUNCIONALIDADES */}
      <section id="funciones" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <Reveal>
          <h2 className={`${h2} text-center`}>Todo el control de <span className={G}>tus cobros.</span></h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([t, d, soon], i) => (
            <Reveal key={t} delay={(i % 4) * 70}>
              <div className={`${card} h-full`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#00D6A0]/10 text-[#00D6A0]">✓</span>
                  {soon && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#A7B4C3]">Próximamente</span>}
                </div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-[#A7B4C3]">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. PLANES */}
      <section id="planes" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <Reveal>
          <h2 className={`${h2} text-center`}>Un plan para cada etapa de <span className={G}>tu comercio.</span></h2>
          <p className="mt-3 text-center text-sm text-[#A7B4C3]">Valores en dólares estadounidenses (USD).</p>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {(["starter", "pro", "enterprise"] as const).map((id, i) => {
            const p = PLANS[id];
            const ui = PLAN_UI[id];
            const featured = id === "pro";
            return (
              <Reveal key={id} delay={i * 100}>
                <div className={`flex h-full flex-col rounded-2xl border p-6 ${featured ? "border-[#00D6A0] bg-[#00D6A0]/[0.06] shadow-[0_0_50px_-15px_rgba(0,214,160,0.5)]" : "border-white/10 bg-[#0A131D]"}`}>
                  {featured && <span className={`mb-2 text-xs font-bold uppercase tracking-wide ${G}`}>Más vendido</span>}
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-[#A7B4C3]">{ui.desc}</p>
                  <p className="mt-5 text-4xl font-extrabold">USD {p.priceMonthly}<span className="text-base font-normal text-[#A7B4C3]"> / mes</span></p>
                  <p className="text-sm text-[#A7B4C3]">Abono mensual · setup único opcional de USD {p.setup}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {ui.features.map((f) => (
                      <li key={f} className="flex gap-2"><span className={G}>✓</span><span className="text-[#E6ECF2]">{f}</span></li>
                    ))}
                  </ul>
                  <a href={buyLink(p.name)} className={`mt-6 rounded-lg px-4 py-3 text-center font-semibold transition-colors ${featured ? "bg-[#00D6A0] text-[#050B12] hover:bg-[#20E6C0]" : "border border-white/20 hover:border-white/40"}`}>
                    Contratar
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 7. LICENCIA PROPIA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <Reveal>
          <div className="rounded-3xl border border-[#00D6A0]/30 bg-gradient-to-br from-[#00D6A0]/10 to-transparent p-8 sm:p-12">
            <h2 className={h2}>Tu comercio. Tu cuenta. <span className={G}>Tu control.</span></h2>
            <p className="mt-4 max-w-2xl text-[#A7B4C3]">ARCREDIX cuenta con un sistema de licencias y acceso para cada comercio.</p>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {["Acceso individual por comercio", "Gestión de vigencia", "Administración centralizada", "Control de usuarios", "Acceso seguro al portal"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className={G}>✓</span>{t}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[#A7B4C3]">
              ¿Preferís no pagar abonos mensuales? Consultá por la <strong className="text-white">Licencia Propia</strong> (pago único de USD {PLANS.lifetime.setup}).
            </p>
            <a href={buyLink(PLANS.lifetime.name)} className="mt-5 inline-block rounded-lg border border-[#00D6A0] px-5 py-2.5 text-sm font-semibold text-[#00D6A0] transition-colors hover:bg-[#00D6A0]/10">Consultar por la licencia</a>
          </div>
        </Reveal>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <Reveal>
          <h2 className={`${h2} mb-10 text-center`}>Preguntas frecuentes.</h2>
        </Reveal>
        <Faq items={FAQ} />
      </section>

      {/* 9. CTA FINAL */}
      <section className="px-4 py-20">
        <Reveal>
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 p-10 text-center" style={{ background: "radial-gradient(70% 120% at 50% 0%, rgba(0,214,160,0.14), rgba(32,230,192,0.04) 55%, transparent)" }}>
            <h2 className={h2}>Protegé tus operaciones desde hoy.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#A7B4C3]">Empezá a mejorar el control de tus cobros con ARCREDIX.</p>
            <a href="#planes" className="mt-8 inline-block rounded-lg bg-[#00D6A0] px-8 py-3 font-semibold text-[#050B12] transition-colors hover:bg-[#20E6C0]">Ver planes</a>
          </div>
        </Reveal>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-white/10 px-4 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-[#A7B4C3]">Validá tus cobros. Evitá estafas.</p>
          </div>
          <nav aria-label="Enlaces" className="grid grid-cols-2 gap-2 text-sm text-[#A7B4C3]">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <a href="#como-funciona" className="hover:text-white">Cómo funciona</a>
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#planes" className="hover:text-white">Planes</a>
            <a href="#faq" className="hover:text-white">Preguntas frecuentes</a>
            <Link href="/login" className="hover:text-white">Ingresar</Link>
          </nav>
          <div className="space-y-2 text-sm text-[#A7B4C3]">
            <Link href="/terminos" className="block hover:text-white">Términos y condiciones</Link>
            <Link href="/privacidad" className="block hover:text-white">Política de privacidad</Link>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-center text-xs text-[#A7B4C3]/70">ARCREDIX. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
