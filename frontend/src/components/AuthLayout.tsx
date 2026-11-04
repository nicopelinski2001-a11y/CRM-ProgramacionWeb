import { ReactNode } from "react";
import { Icon } from "./Icon";
import "./auth.css";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-story" aria-label="Acerca de Órbita CRM">
        <a href="/" className="auth-brand" aria-label="Órbita, inicio">
          <span className="auth-brand-mark">
            <Icon name="orbit" size={25} />
          </span>
          órbita<span className="auth-brand-dot">.</span>
          <span className="auth-brand-label">CRM</span>
        </a>

        <div className="auth-story-content">
          <span className="auth-eyebrow">CONECTÁ. ORGANIZÁ. CRECÉ.</span>
          <h2>
            Cada contacto.
            <br />
            Una nueva
            <br />
            <span>posibilidad.</span>
          </h2>
          <p>
            Conocé mejor a tus clientes y construí relaciones que hacen crecer
            tu negocio.
          </p>

          <div className="auth-illustration" aria-hidden="true">
            <div className="auth-orbit auth-orbit-one" />
            <div className="auth-orbit auth-orbit-two" />
            <span className="auth-orbit-dot" />
            <div className="auth-contact-preview">
              <span className="auth-preview-label">RELACIONES QUE CRECEN</span>
              <div className="auth-preview-contact">
                <span className="auth-preview-check">
                  <Icon name="check" size={15} />
                </span>
                <span>Contactos organizados</span>
              </div>
              <div className="auth-preview-contact">
                <span className="auth-preview-check">
                  <Icon name="check" size={15} />
                </span>
                <span>Información al día</span>
              </div>
              <div className="auth-preview-contact auth-preview-current">
                <span className="auth-preview-circle" />
                <span>Próximas oportunidades</span>
                <span className="auth-preview-spark">✦</span>
              </div>
            </div>
            <div className="auth-floating-check">
              <Icon name="check" size={26} />
            </div>
          </div>
        </div>

        <p className="auth-story-footer">
          <span /> Tus clientes. Tu negocio. Todo conectado.
        </p>
      </aside>

      <section className="auth-form-side" aria-label="Acceso a tu cuenta">
        <a href="/" className="auth-mobile-brand">
          <Icon name="orbit" size={27} /> órbita.
          <span className="auth-brand-label">CRM</span>
        </a>
        <div className="auth-form-container">{children}</div>
        <p className="auth-page-footer">
          Buenas relaciones. Nuevas posibilidades.
        </p>
      </section>
    </main>
  );
}
