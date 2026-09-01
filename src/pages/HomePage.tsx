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
    <main>
      <h1>Página principal</h1>

      {user ? (
        <>
          <p>Bienvenido, {user.name}</p>
          <p>Carnet: {user.carnet}</p>
          <p>Rol: {user.role}</p>

          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </>
      ) : (
        <p>No existe una sesión activa.</p>
      )}
    </main>
  );
}

export default HomePage;
