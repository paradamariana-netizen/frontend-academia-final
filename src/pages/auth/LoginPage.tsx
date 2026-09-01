import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import { authRepository } from "../../repositories/authRepository";

import type { LoginCredentials } from "../../types/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  if (authRepository.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (credentials: LoginCredentials) => {
    setError("");

    const user = authRepository.login(credentials);

    if (!user) {
      setError("El carnet o la contraseña son incorrectos.");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Academia">
        <div className="brand"><span className="brand-mark">a</span><span>academia</span></div>
        <div className="showcase-copy">
          <p className="eyebrow">PLATAFORMA EDUCATIVA</p>
          <h2>Enseñar transforma.<br /><em>Aprender inspira.</em></h2>
          <p>Un espacio creado para impulsar el conocimiento y hacer crecer cada talento.</p>
        </div>
        <div className="showcase-footer"><span>✦</span> Aprende, enseña, evoluciona.</div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand"><span className="brand-mark">a</span> academia</div>
        <LoginForm error={error} onSubmit={handleLogin} />
        <p className="help-text">¿Necesitas ayuda? <a href="mailto:soporte@academia.edu">Contacta a soporte</a></p>
      </section>
    </main>
  );
}

export default LoginPage;
