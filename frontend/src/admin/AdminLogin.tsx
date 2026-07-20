import { useNavigate } from "react-router-dom";
import logo from "../img/logo_gcs_blanco.png";
import { AdminLoginForm } from "./AdminLoginForm";

export function AdminLogin() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-[color:var(--map-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="glass-panel space-y-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <img src={logo} alt="Global Customs Solutions" className="h-10 w-auto" />
            <div>
              <h1 className="font-display text-lg font-semibold text-[color:var(--text)]">
                Panel de administración
              </h1>
              <p className="mono-label mt-1 text-[10px] text-[color:var(--muted)]">
                Global Customs Solutions · Dashboard de Tickets
              </p>
            </div>
          </div>

          <AdminLoginForm onSuccess={() => navigate("/admin/sites", { replace: true })} />
        </div>

        <a
          href="/"
          className="mt-4 block text-center text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
        >
          Volver al dashboard
        </a>
      </div>
    </div>
  );
}
