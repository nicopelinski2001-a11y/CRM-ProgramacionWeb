import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Icon } from "../components/Icon";
import { getErrorMessage } from "../api/errors";

export function RegisterPage() {
  const { register, user, isLoading: isRestoringSession } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!name.trim()) {
        setError("Contanos tu nombre para crear tu cuenta.");
        return;
      }
      await register(email.trim(), password, name.trim());
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        getErrorMessage(err, "No pudimos crear tu cuenta. Intentá de nuevo."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isRestoringSession)
    return (
      <AuthLayout>
        <p className="auth-session-loading" role="status">
          <span className="auth-spinner" /> Recuperando tu sesión...
        </p>
      </AuthLayout>
    );
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout>
      <span className="auth-form-kicker">
        <span /> UN NUEVO COMIENZO
      </span>
      <h1 className="auth-heading">Tu próximo vínculo empieza acá.</h1>
      <p className="auth-subtitle">
        Creá tu cuenta y reuní a tus clientes en un solo lugar.
      </p>
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={isLoading}>
        <div className="auth-field">
          <label htmlFor="register-name">Tu nombre</label>
          <input
            id="register-name"
            className="auth-input"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="¿Cómo te llamás?"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            className="auth-input"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@empresa.com"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Contraseña</label>
          <div className="auth-password">
            <input
              id="register-password"
              className="auth-input"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={15}
              maxLength={72}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Elegí una contraseña"
              aria-describedby="register-password-hint"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
          <p id="register-password-hint" className="auth-field-hint">
            Usá al menos 15 caracteres. Una frase es fácil de recordar.
          </p>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={isLoading} className="auth-submit">
          {isLoading ? "Creando tu cuenta..." : "Crear mi cuenta"}
          {!isLoading && <Icon name="arrow-right" size={16} />}
        </button>
      </form>
      <p className="auth-switch">
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
      <p className="auth-privacy">
        <Icon name="lock" size={12} /> Un espacio privado para tus contactos.
      </p>
    </AuthLayout>
  );
}
