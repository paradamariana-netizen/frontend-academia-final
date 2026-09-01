import { useNavigate } from "react-router-dom";

import { authRepository } from "../repositories/authRepository";

function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="home-page">
      <div className="home-card">
      <span className="brand-mark">a</span>
      <h1>Panel de {user?.role === "ADMIN" ? "administración" : "instructor"}</h1>

      {user ? (
        <>
          <p>Bienvenido, {user.name}</p>
          <p>Carnet: {user.carnet}</p>
          <p className="role-badge">{user.role === "ADMIN" ? "Administrador" : "Instructor"}</p>

          <button className="logout-button" type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </>
      ) : (
        <p>No existe una sesión activa.</p>
      )}
      </div>
    </main>
  );
}

export default HomePage;
