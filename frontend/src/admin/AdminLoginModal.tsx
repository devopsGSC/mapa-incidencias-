import { IconX } from "@tabler/icons-react";
import { useEffect } from "react";
import logo from "../img/logo_gcs_blanco.png";
import { AdminLoginForm } from "./AdminLoginForm";

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/** Acceso rápido al panel admin desde el dashboard, sin pasar por /admin/login como página completa. */
export function AdminLoginModal({ onClose, onSuccess }: AdminLoginModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm space-y-6 p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col items-start gap-3">
            <img src={logo} alt="Global Customs Solutions" className="h-9 w-auto" />
            <div>
              <h2 className="font-display text-base font-semibold text-[color:var(--text)]">
                Panel de administración
              </h2>
              <p className="mono-label mt-1 text-[10px] text-[color:var(--muted)]">
                Acceso restringido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-[color:var(--muted)] transition-colors hover:bg-white/5 hover:text-[color:var(--text)]"
          >
            <IconX size={18} stroke={2} />
          </button>
        </div>

        <AdminLoginForm onSuccess={onSuccess} />
      </div>
    </div>
  );
}
