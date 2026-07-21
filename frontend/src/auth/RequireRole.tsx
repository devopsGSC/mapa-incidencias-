import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Role } from "../types";
import { useAuth } from "./AuthContext";

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
}

/**
 * Defensa en profundidad para rutas admin-only: el backend ya rechaza estos
 * endpoints con 403 para cualquier rol que no sea el permitido, esto solo
 * evita que un usuario "normal" vea una pantalla rota si escribe la URL a
 * mano en vez de recibir un mensaje de error de la API.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user } = useAuth();
  if (!user || user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
