import { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { LoginModal } from "./LoginModal";

/** Envuelve toda la app: sin sesión válida, muestra el login en vez de cualquier ruta — el dashboard ya no es público. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mono-label flex h-screen items-center justify-center bg-[color:var(--map-bg)] text-xs text-[color:var(--muted)]">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  return <>{children}</>;
}
