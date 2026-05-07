const styles = {
  wrapper: "flex flex-col items-center justify-center py-20 px-4 gap-32",
  section: "w-full max-w-4xl text-center",
  title: "text-4xl md:text-5xl font-bold mb-12 text-slate-100",
  textContainer: "text-left text-slate-400 space-y-6 text-lg leading-relaxed",
  gridWrapper: "grid grid-cols-1 md:grid-cols-2 gap-8 text-left",
  valueCard: "p-8 bg-slate-900/40 border border-slate-800 rounded-2xl",
  valueTitle: "text-xl font-bold text-slate-200 mb-3",
  valueDescription: "text-slate-400",
  teamGrid: "grid grid-cols-1 md:grid-cols-2 gap-12 mt-12",
  teamMemberCard: "flex flex-col items-center p-8 bg-slate-900/40 border border-slate-800 rounded-3xl group hover:border-secondary/30 transition-colors",
  teamMemberAvatar: "w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mb-6 border-2 border-slate-700 group-hover:border-secondary transition-colors",
  teamMemberName: "text-2xl font-bold text-slate-100 mb-1",
  teamMemberRole: "text-secondary font-medium uppercase tracking-widest text-sm",
  adminGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 w-full",
  adminCard: "flex flex-col items-center p-6 bg-slate-900/20 border border-slate-800/50 rounded-2xl",
  adminAvatar: "w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700",
  adminName: "text-slate-200 font-bold mb-1",
  adminRole: "text-slate-500 text-sm"
};

export default function NosotrosPage() {
  return (
    <div className={styles.wrapper}>
      {/* Sección Historia */}
      <section className={styles.section}>
        <h1 className={styles.title}>Nuestra Historia</h1>
        <div className={styles.textContainer}>
          <p>
            Fundada en 2024, GoPay nació con la misión de democratizar el acceso a la tecnología.
            Creemos que todos deberían tener la oportunidad de contar con un smartphone de última
            generación sin que el pago inicial sea un obstáculo insuperable.
          </p>
          <p>
            A través de nuestro innovador sistema de financiamiento y pagos semanales accesibles,
            hemos ayudado a miles de personas a mantenerse conectadas con sus seres queridos,
            acceder a mejores oportunidades laborales y disfrutar del mundo digital.
          </p>
        </div>
      </section>

      {/* Sección Valores */}
      <section id="valores" className={styles.section}>
        <h2 className={styles.title}>Nuestros Valores</h2>
        <div className={styles.gridWrapper}>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Transparencia</h3>
            <p className={styles.valueDescription}>Sin letras pequeñas ni cargos ocultos. Lo que ves es exactamente lo que pagas.</p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Inclusión</h3>
            <p className={styles.valueDescription}>Aprobamos a 9 de cada 10 personas porque confiamos en ti y en tus ganas de progresar.</p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Innovación</h3>
            <p className={styles.valueDescription}>Buscamos constantemente nuevas formas de hacer que la tecnología sea más accesible.</p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Empatía</h3>
            <p className={styles.valueDescription}>Entendemos tus necesidades y trabajamos para brindarte las mejores soluciones.</p>
          </div>
        </div>
      </section>

      {/* Sección Equipo */}
      <section className="w-full max-w-5xl text-center">
        <h2 className={styles.title}>Nuestro Equipo</h2>
        
        {/* Directores */}
        <div className={styles.teamGrid}>
          <div className={styles.teamMemberCard}>
            <div className={styles.teamMemberAvatar}>
              <span className="material-symbols-outlined text-5xl text-slate-500">person</span>
            </div>
            <h3 className={styles.teamMemberName}>Nelson De León.</h3>
            <span className={styles.teamMemberRole}>Director Fundador</span>
          </div>
          <div className={styles.teamMemberCard}>
            <div className={styles.teamMemberAvatar}>
              <span className="material-symbols-outlined text-5xl text-slate-500">person</span>
            </div>
            <h3 className={styles.teamMemberName}>Eduardo Hernandez.</h3>
            <span className={styles.teamMemberRole}>Director Co-Fundador</span>
          </div>
        </div>

        {/* Administrativos */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">Administrativos</h3>
          <div className={`${styles.adminGrid} max-w-5xl mx-auto`}>
            {[
              { name: "Nery J", role: "Administración general" },
              { name: "Moises J.", role: "Administración" },
              { name: "Luisito C.", role: "Gerente General" }
            ].map((member, index) => (
              <div key={index} className={styles.adminCard}>
                <div className={styles.adminAvatar}>
                  <span className="material-symbols-outlined text-3xl text-slate-600">person</span>
                </div>
                <div className={styles.adminName}>{member.name}</div>
                <div className={styles.adminRole}>{member.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Otros */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">Otros cargos</h3>
          <div className={styles.adminGrid}>
            {[
              { name: "Carlos R.", role: "Soporte" },
              { name: "Ana M.", role: "Marketing" },
              { name: "Pedro S.", role: "Contaduria" },
              { name: "Jonathan S.", role: "Developer" },
              { name: "+20", role: "Closers" },
              { name: "+10", role: "Repartidores" },
              
              
            ].map((member, index) => (
              <div key={index} className={styles.adminCard}>
                <div className={styles.adminAvatar}>
                  <span className="material-symbols-outlined text-3xl text-slate-600">person</span>
                </div>
                <div className={styles.adminName}>{member.name}</div>
                <div className={styles.adminRole}>{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
