export default function ServiciosPage() {
  const servicios = [
    {
      titulo: "Celulares a Crédito",
      descripcion: "Accedé a tu smartphone nuevo con mínimos requisitos y planes de pago semanales adaptados para ti.",
      icono: "payments"
    },
    {
      titulo: "Entrega en Locales",
      descripcion: "Retirá tu equipo de forma inmediata en cualquiera de nuestros puntos de entrega autorizados.",
      icono: "store"
    },
    {
      titulo: "Entrega a Domicilio",
      descripcion: "Recibí tu nuevo celular en la comodidad de tu casa con nuestro servicio de envío seguro a todo el país.",
      icono: "local_shipping"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <section className="w-full max-w-5xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-slate-100">Nuestros Servicios</h1>
        <p className="text-xl text-slate-400 mb-16 max-w-3xl mx-auto">
          Simplificamos el acceso a la tecnología con soluciones pensadas para tu comodidad.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-16">
          {servicios.map((servicio, index) => (
            <div key={index} className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl hover:bg-slate-900/60 transition-colors">
              <span className="material-symbols-outlined text-4xl text-secondary mb-4">
                {servicio.icono}
              </span>
              <h3 className="text-2xl font-bold text-slate-200 mb-3">{servicio.titulo}</h3>
              <p className="text-slate-400 text-lg leading-relaxed">{servicio.descripcion}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/20 border border-dashed border-slate-700 rounded-2xl p-8">
          <p className="text-slate-500 italic text-xl">
            ✨ Próximamente nuevos servicios
          </p>
        </div>
      </section>
    </div>
  );
}
