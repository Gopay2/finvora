import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export const metadata: Metadata = {
  title: "Política de Privacidad | Finvora",
  description:
    "Aviso de Privacidad Integral de Finvora de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.",
  alternates: {
    canonical: "https://finvora.mx/politica-de-privacidad",
  },
  openGraph: {
    title: "Política de Privacidad | Finvora",
    description:
      "Conoce cómo protegemos tus datos personales conforme a la ley mexicana (LFPDPPP).",
    url: "https://finvora.mx/politica-de-privacidad",
    siteName: "Finvora",
    locale: "es_MX",
    type: "website",
  },
};

export default function PoliticaDePrivacidadPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 text-slate-300 pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-roboto)]">
        <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-10 shadow-2xl backdrop-blur-sm">
          {/* Tag & Header */}
          <div className="border-b border-slate-800 pb-6 mb-8">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded-full mb-3 uppercase">
              Cumplimiento LFPDPPP México
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-[family-name:var(--font-outfit)] tracking-tight mb-2">
              Política de Privacidad
            </h1>
            <p className="text-slate-400 text-sm">
              Última actualización: Agosto de 2026
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-300">
            {/* Introducción */}
            <section>
              <p>
                En <strong>Finvora</strong> estamos comprometidos con la protección de tus datos personales y con el cumplimiento estricto de la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> de los Estados Unidos Mexicanos, su Reglamento y demás normatividad aplicable.
              </p>
            </section>

            {/* 1. Identidad y Domicilio (Art. 16 Frac. I) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-outfit)] flex items-start gap-2.5 leading-snug">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 text-secondary text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                  1
                </span>
                <span>Identidad y Domicilio del Responsable</span>
              </h2>
              <p>
                El responsable del tratamiento y protección de sus datos personales es Finvora Capital, con domicilio en Derecho de Vía 18501 entre calles Boulevard Paramo y Calle Distrito Federal, Colonia Constitución, Playas de Rosarito, Baja California, C.P. 22707, México.
              </p>
              <p>
                Para cualquier duda, aclaración o ejercicio de sus derechos en relación con este aviso y el tratamiento de sus datos personales, puede comunicarse con nuestro Departamento de Datos Personales mediante el correo electrónico:{" "}
                <a href="mailto:contacto@finvora.mx" className="text-secondary hover:underline font-semibold">
                  contacto@finvora.mx
                </a>.
              </p>
            </section>

            {/* 2. Datos Personales Recabados */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-outfit)] flex items-start gap-2.5 leading-snug">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 text-secondary text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                  2
                </span>
                <span>Datos Personales Recabados</span>
              </h2>
              <p>
                Para llevar a cabo las finalidades descritas en el presente aviso, Finvora recabará y tratará únicamente la siguiente categoría de datos personales:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-300">
                <li><strong>Datos de Identificación y Contacto:</strong> Nombre completo, identificación oficial (INE/IFE), CURP, número telefónico celular y domicilio.</li>
              </ul>
            </section>

            {/* 3. Finalidades del Tratamiento (Art. 16 Frac. II) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-outfit)] flex items-start gap-2.5 leading-snug">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 text-secondary text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                  3
                </span>
                <span>Finalidades del Tratamiento</span>
              </h2>
              <p>
                Sus datos personales serán utilizados para las siguientes finalidades:
              </p>
              
              <h3 className="text-base font-semibold text-slate-200 pt-1">A) Finalidades Primarias</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-300">
                <li>Validar y verificar su identidad y la autenticidad de la documentación presentada.</li>
                <li>Evaluar y procesar su solicitud de adquisición o financiamiento de equipos celulares.</li>
                <li>Gestión, administración, entrega y facturación de los productos adquiridos.</li>
                <li>Procesar cobros, pagos semanales o periódicos acordados y realizar gestiones de cobranza.</li>
                <li>Atender solicitudes, dudas, quejas, aclaraciones y brindar soporte técnico o de atención a clientes.</li>
                <li>Cumplir con obligaciones legales derivadas de la relación contractual o comercial.</li>
              </ul>

              <h3 className="text-base font-semibold text-slate-200 pt-2">B) Finalidades Secundarias</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-300">
                <li>Envío de promociones, boletines informativos, ofertas exclusivas y publicidad de Finvora.</li>
                <li>Realización de encuestas de satisfacción, estudios de mercado y análisis estadísticos.</li>
              </ul>
              {/* Opciones para limitar uso o divulgación (Art. 16 Frac. III) */}
              <p className="text-xs text-slate-400">
                Si no deseas que tus datos sean tratados para las finalidades secundarias, puedes manifestar tu negativa en cualquier momento mediante una solicitud enviada al correo de contacto de atención indicado en este aviso.
              </p>
            </section>

            {/* 4. Derechos ARCO y Revocación (Art. 16 Frac. IV) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-outfit)] flex items-start gap-2.5 leading-snug">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 text-secondary text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                  4
                </span>
                <span>Derechos ARCO y Revocación</span>
              </h2>
              <p>
                De acuerdo con la LFPDPPP, usted o su representante legal tienen derecho en todo momento a ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación u Oposición (Derechos ARCO)</strong>, así como a revocar el consentimiento otorgado.
              </p>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Procedimiento para Solicitudes ARCO (Art. 29 LFPDPPP)</h3>
                <p className="text-xs sm:text-sm">
                  La solicitud deberá remitirse por escrito al correo de atención señalando lo siguiente:
                </p>
                <ol className="list-decimal pl-6 space-y-1 text-xs sm:text-sm text-slate-300">
                  <li>Nombre del titular y correo electrónico u otro medio para comunicarle la respuesta.</li>
                  <li>Documentos que acrediten su identidad (copia de INE/pasaporte) o la de su representante legal.</li>
                  <li>Descripción clara y precisa de los datos personales respecto de los que busca ejercer alguno de los derechos ARCO.</li>
                  <li>Cualquier otro elemento o documento que facilite la localización de los datos.</li>
                </ol>
                <div className="border-t border-slate-800 pt-3 text-xs text-slate-400">
                  <strong>Plazos de Atención (Art. 32 LFPDPPP):</strong> Finvora le comunicará la determinación adoptada en un plazo máximo de <strong>20 (veinte) días hábiles</strong> contados a partir de la recepción. De resultar procedente, se hará efectiva dentro de los <strong>15 (quince) días hábiles</strong> siguientes a la notificación.
                </div>
              </div>
            </section>

            {/* 5. Transferencia de Datos (Art. 16 Frac. V) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-outfit)] flex items-start gap-2.5 leading-snug">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 text-secondary text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                  5
                </span>
                <span>Transferencia de Datos Personales</span>
              </h2>
              <p>
                Finvora podrá transferir sus datos personales sin requerir de su consentimiento previo únicamente en los supuestos previstos en el <strong>Artículo 37 de la LFPDPPP</strong>, tales como:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-300">
                <li>Socios de financiamiento y plataformas aliadas (incluyendo PayJoy) con el fin de evaluar, procesar y originar la solicitud de crédito o pago a plazos gestionada por el usuario.</li>
                <li>Empresas de mensajería, paquetería y logística necesarias para la entrega física de los equipos en su domicilio.</li>
                <li>Procesadores de pago encargados de la liquidación de las transacciones.</li>
                <li>Autoridades competentes cuando sea requerido por ley o resolución judicial.</li>
              </ul>
              <p>
                Dichos terceros asumirán las mismas obligaciones que corresponden a Finvora para garantizar el resguardo confidencial y seguro de sus datos.
              </p>
            </section>

            {/* 6. Cambios al Aviso (Art. 16 Frac. VI) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-outfit)] flex items-start gap-2.5 leading-snug">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-800 border border-slate-700/60 text-secondary text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                  6
                </span>
                <span>Modificaciones a la Política</span>
              </h2>
              <p>
                El presente aviso puede sufrir modificaciones derivadas de requerimientos legales o de nuestras prácticas de privacidad. Todas las actualizaciones estarán disponibles en:{" "}
                <a href="https://finvora.mx/politica-de-privacidad" className="text-secondary hover:underline font-medium">
                  https://finvora.mx/politica-de-privacidad
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
