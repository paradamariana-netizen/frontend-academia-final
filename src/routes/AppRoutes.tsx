
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import { authRepository } from "../repositories/authRepository";
import type { User } from "../types/auth";

function AppRoutes() {
  const [user, setUser] = useState<User | null>(() =>
    authRepository.getCurrentUser()
  );

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authRepository.getCurrentUser());
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setUser(authRepository.getCurrentUser());
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/"
          element={
            user ? <HomePage /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
