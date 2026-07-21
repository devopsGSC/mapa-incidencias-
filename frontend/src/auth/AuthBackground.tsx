import { ReactNode } from "react";
import backgroundImage from "../assets/dashboard-preview.jpg";

interface AuthBackgroundProps {
  children: ReactNode;
}

/**
 * Fondo compartido por todas las pantallas de auth (login, "olvidé mi
 * contraseña", restablecer contraseña): una captura ESTÁTICA y difuminada
 * del dashboard (frontend/src/assets/dashboard-preview.jpg) — nunca datos en
 * vivo, mostrar el mapa real antes de loguearse implicaría exponer
 * /api/tickets y /api/sites sin autenticación. El blur se aplica con CSS
 * (filter: blur), no está "horneado" en la imagen, para poder ajustar el
 * nivel después sin regenerar el archivo.
 *
 * ⚠️ Si el dashboard cambia mucho de diseño más adelante, esta captura queda
 * desactualizada — actualizarla es responsabilidad de quien haga ese cambio.
 */
export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden px-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: "blur(7px)",
          transform: "scale(1.08)",
        }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 w-full max-w-[320px]">
        <div
          className="space-y-6 rounded-xl border border-[color:var(--glass-border)] p-8"
          style={{ background: "var(--surface-1)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
