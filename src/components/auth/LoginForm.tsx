import { useState } from "react";
import type { FormEventHandler } from "react";
import type { LoginCredentials, UserRole } from "../../types/auth";

interface LoginFormProps {
  error?: string;
  onSubmit: (credentials: LoginCredentials) => void;
}

function LoginForm({ error, onSubmit }: LoginFormProps) {
  const [carnet, setCarnet] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const normalizedCarnet = carnet.trim();

    if (!normalizedCarnet || !password) {
      return;
    }

    onSubmit({
      carnet: normalizedCarnet,
      password,
      role,
    });
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <p className="eyebrow">ACCESO SEGURO</p>
        <h1>Bienvenido de nuevo</h1>
        <p>Ingresa tus credenciales para continuar.</p>
      </div>

      <fieldset className="role-selector">
        <legend>¿Cómo deseas ingresar?</legend>
        <div className="role-options">
          <label className={`role-option ${role === "ADMIN" ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="role"
              value="ADMIN"
              checked={role === "ADMIN"}
              onChange={() => setRole("ADMIN")}
            />
            <span className="role-icon" aria-hidden="true">⌘</span>
            <span><strong>Administrador</strong><small>Gestiona la plataforma</small></span>
          </label>
          <label className={`role-option ${role === "INSTRUCTOR" ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="role"
              value="INSTRUCTOR"
              checked={role === "INSTRUCTOR"}
              onChange={() => setRole("INSTRUCTOR")}
            />
            <span className="role-icon" aria-hidden="true">◒</span>
            <span><strong>Instructor</strong><small>Gestiona tus cursos</small></span>
          </label>
        </div>
      </fieldset>

      <div className="field-group">
        <label htmlFor="carnet">Carnet de identidad</label>
        <div className="input-wrap">
          <span aria-hidden="true">#</span>
          <input id="carnet" name="carnet" type="text" value={carnet} onChange={(event) => setCarnet(event.target.value)} placeholder="Ingresa tu carnet" autoComplete="username" required />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="password">Contraseña</label>
        <div className="input-wrap">
          <span aria-hidden="true">●</span>
          <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" autoComplete="current-password" required />
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <button className="submit-button" type="submit">Ingresar a mi cuenta <span aria-hidden="true">→</span></button>
    </form>
  );
}

export default LoginForm;
