import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Icon } from "../components/Icon";
import { getErrorMessage } from "../api/errors";

export function LoginPage() {
  const { login, user, isLoading: isRestoringSession } = useAuth();
  const navigate = useNavigate();
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
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "No pudimos iniciar sesión. Revisá tu email y contraseña.",
        ),
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
        <span /> TU NEGOCIO, MÁS CONECTADO
      </span>
      <h1 className="auth-heading">Qué bueno verte de nuevo.</h1>
      <p className="auth-subtitle">Iniciá sesión y conectá con tus clientes.</p>
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={isLoading}>
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password">Contraseña</label>
          <div className="auth-password">
            <input
              id="login-password"
              className="auth-input"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
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
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={isLoading} className="auth-submit">
          {isLoading ? "Ingresando..." : "Iniciar sesión"}
          {!isLoading && <Icon name="arrow-right" size={16} />}
        </button>
      </form>
      <p className="auth-switch">
        ¿Primera vez por acá? <Link to="/register">Creá tu cuenta</Link>
      </p>
      <p className="auth-privacy">
        <Icon name="lock" size={12} /> Un espacio privado para tus contactos.
      </p>
    </AuthLayout>
  );
}
