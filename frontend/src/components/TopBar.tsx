import { ReactNode } from "react";
import logo from "../img/logo_gcs_blanco.png";
import { SoundToggle } from "./SoundToggle";
import { SyncStatus } from "./SyncStatus";

export type DashboardView = "map" | "metrics";

interface TopBarProps {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
  connected: boolean;
  lastHeartbeatAt: Date | null;
}

export function TopBar({ view, onViewChange, connected, lastHeartbeatAt }: TopBarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-4 bg-gradient-to-b from-[#080c16] to-transparent px-5 py-4">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Global Customs Solutions" className="h-9 w-auto" />
        <div>
          <h1 className="font-display text-lg font-semibold text-[color:var(--text)]">
            Dashboard de Tickets — Sitios El Salvador
          </h1>
          <p className="mono-label mt-0.5 text-[10px] text-[color:var(--muted)]">
            Global Customs Solutions · Mesa de ayuda
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <nav className="glass-panel flex items-center gap-1 rounded-full p-1">
          <ViewButton active={view === "map"} onClick={() => onViewChange("map")}>
            Mapa
          </ViewButton>
          <ViewButton active={view === "metrics"} onClick={() => onViewChange("metrics")}>
            Métricas
          </ViewButton>
        </nav>
        <SoundToggle />
        <SyncStatus connected={connected} lastHeartbeatAt={lastHeartbeatAt} />
      </div>
    </header>
  );
}

function ViewButton({
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
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[#1A294C] text-[#7099FF]"
          : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}
