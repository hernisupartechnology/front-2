import { Link } from 'react-router-dom';
import { Calendar, Pill, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

/**
 * Página pública de inicio — UparVital.
 * Visible sin autenticación. Redirige al dashboard si hay sesión activa (manejado en App.tsx).
 */
export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0d1f0e 0%, #1B5E20 50%, #2E7D32 100%)' }}>
      {/* Header de navegación */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            UV
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            UparVital
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="btn btn--primary text-sm px-5 py-2.5"
            style={{ background: 'white', color: '#1B5E20', minHeight: 'auto' }}
          >
            Registrarse gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 pb-20 text-center max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#A5D6A7' }}
        >
          <Activity size={14} />
          <span>Gestión de salud familiar en Colombia</span>
        </div>

        <h1
          className="text-4xl md:text-6xl font-bold text-white mb-6"
          style={{ fontFamily: 'var(--font-display)', lineHeight: 1.15 }}
        >
          La salud de tu familia,{' '}
          <span style={{ color: '#A5D6A7' }}>siempre bajo control</span>
        </h1>

        <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Centraliza citas médicas, medicamentos, exámenes, remisiones y vacunas de todos
          los miembros de tu hogar. Con alertas inteligentes y semáforo de colores.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="btn w-full sm:w-auto px-8 py-4 text-base font-semibold gap-2"
            style={{ background: '#A5D6A7', color: '#1B5E20', minHeight: 'auto', borderRadius: '12px' }}
          >
            Comenzar gratis <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="btn w-full sm:w-auto px-8 py-4 text-base"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', minHeight: 'auto', borderRadius: '12px' }}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Cards de características */}
      <section className="px-6 md:px-12 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Calendar,
              title: 'Historial familiar completo',
              description:
                'Todos los miembros del hogar en un solo lugar. Los padres gestionan el historial de sus hijos menores.',
              color: '#A5D6A7',
            },
            {
              icon: ShieldCheck,
              title: 'Semáforo de alertas inteligente',
              description:
                'Sabe de un vistazo qué citas son urgentes 🔴, cuáles van pronto 🟡 y cuáles están bajo control 🟢.',
              color: '#81C784',
            },
            {
              icon: Pill,
              title: 'Medicamentos, exámenes y más',
              description:
                'Seguimiento completo del flujo EPS: autorización, despacho, renovación de medicamentos crónicos y recordatorios de toma.',
              color: '#66BB6A',
            },
          ].map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="p-6 rounded-2xl animate-fade-in"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}22` }}
              >
                <Icon size={24} style={{ color }} />
              </div>
              <h3
                className="text-white font-semibold text-lg mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center">
        <p className="text-white/40 text-sm">
          © 2026 UparVital · Desarrollado por UparTechnology
        </p>
      </footer>
    </div>
  );
}
