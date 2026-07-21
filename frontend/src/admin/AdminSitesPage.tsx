import { IconArrowLeft, IconLogout } from "@tabler/icons-react";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/dashboard-preview.jpg";
import { useAuth } from "../auth/AuthContext";
import logo from "../img/logo_gcs_blanco.png";
import { AdminSitesSection } from "./AdminSitesSection";
import { AdminUsersSection } from "./AdminUsersSection";

type AdminTab = "sites" | "users";

export function AdminSitesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>("sites");

  return (
    <div className="relative min-h-screen">
      {/*
        Mismo screenshot estático que el modal de login (frontend/src/assets/dashboard-preview.jpg),
        para dar continuidad visual entre el login y el panel. Overlay más
        oscuro que el del login (0.68 vs 0.45): este panel es sobrio/grayscale
        y la imagen no debe competir con las tablas ni las badges de borde
        fino. Se ve detrás de la barra superior y el menú lateral a propósito
        (son transparentes, sin bg propio) — si el dashboard cambia mucho de
        diseño, actualizar también esta captura.
      */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, filter: "blur(7px)", transform: "scale(1.08)" }}
      />
      <div className="fixed inset-0 bg-black/[0.68]" />

      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-[color:var(--glass-border)] px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Global Customs Solutions" className="h-7 w-auto" />
          <h1 className="font-display text-sm font-semibold text-[color:var(--text)]">
            Global Customs Solutions{" "}
            <span className="font-normal text-[color:var(--text-secondary)]">— Administración</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Volver al dashboard"
            title="Volver al dashboard"
            className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text)]"
          >
            <IconArrowLeft size={16} stroke={2} />
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text)]"
          >
            <IconLogout size={16} stroke={2} />
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 top-16 z-10 flex w-[150px] flex-col gap-0.5 border-r border-[color:var(--glass-border)] px-2 py-4 backdrop-blur-sm">
        <SidebarItem active={tab === "sites"} onClick={() => setTab("sites")}>
          Sitios
        </SidebarItem>
        <SidebarItem active={tab === "users"} onClick={() => setTab("users")}>
          Usuarios
        </SidebarItem>
      </nav>

      <main className="relative z-0 ml-[150px] min-h-screen px-8 pb-10 pt-24">
        {tab === "sites" ? <AdminSitesSection /> : <AdminUsersSection />}
      </main>
    </div>
  );
}

function SidebarItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-l-2 px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-[color:var(--border-accent)] text-[color:var(--text)]"
          : "border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}
