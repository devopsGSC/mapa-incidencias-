import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLoginModal } from "./admin/AdminLoginModal";
import { fetchConfiguredSites } from "./api/adminClient";
import { MapHeroView } from "./components/MapHeroView";
import { MetricsView } from "./components/MetricsView";
import { NotificationStack } from "./components/NotificationStack";
import { TopBar, DashboardView } from "./components/TopBar";
import { useDashboardData } from "./hooks/useDashboardData";
import { computeSiteDepartmentBreakdown, computeSitePriorityPresence } from "./lib/siteDominance";
import { Site } from "./types";

export default function App() {
  const navigate = useNavigate();
  const {
    sites,
    tickets,
    stats,
    loading,
    error,
    connected,
    lastHeartbeatAt,
    notifications,
    dismissNotification,
  } = useDashboardData();
  const [view, setView] = useState<DashboardView>("map");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const handleOpenAdmin = async () => {
    setCheckingAdmin(true);
    try {
      // Si ya hay una sesión admin vigente (cookie httpOnly), este request pasa
      // directo y nos ahorramos mostrarle el login de nuevo.
      await fetchConfiguredSites();
      navigate("/admin/sites");
    } catch {
      setShowAdminLogin(true);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const siteStatsById = useMemo(() => {
    const map = new Map<string, (typeof stats.bySite)[number]>();
    stats.bySite.forEach((entry) => map.set(entry.siteId, entry));
    return map;
  }, [stats.bySite]);

  const departmentBreakdownBySite = useMemo(
    () => computeSiteDepartmentBreakdown(tickets),
    [tickets]
  );

  const sitePriorityPresenceById = useMemo(
    () => computeSitePriorityPresence(tickets),
    [tickets]
  );

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--map-bg)]">
      <TopBar
        view={view}
        onViewChange={setView}
        connected={connected}
        lastHeartbeatAt={lastHeartbeatAt}
        onOpenAdmin={handleOpenAdmin}
        checkingAdmin={checkingAdmin}
      />
      <NotificationStack
        notifications={notifications}
        sites={sites}
        onDismiss={dismissNotification}
      />

      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onSuccess={() => {
            setShowAdminLogin(false);
            navigate("/admin/sites");
          }}
        />
      )}

      {error && (
        <div className="fixed left-1/2 top-[78px] z-40 -translate-x-1/2 rounded-lg border border-[#FF4D6D]/40 bg-[#2a0f16]/90 px-4 py-2 text-sm text-[#ff8fa3]">
          Error cargando datos del backend: {error}. Verifica que la API esté
          corriendo en el puerto 4000.
        </div>
      )}

      {loading ? (
        <div className="mono-label flex h-full items-center justify-center text-xs text-[color:var(--muted)]">
          Cargando dashboard...
        </div>
      ) : view === "map" ? (
        <MapHeroView
          sites={sites}
          tickets={tickets}
          stats={stats}
          siteStatsById={siteStatsById}
          departmentBreakdownBySite={departmentBreakdownBySite}
          sitePriorityPresenceById={sitePriorityPresenceById}
          selectedSite={selectedSite}
          onSelectSite={setSelectedSite}
        />
      ) : (
        <MetricsView tickets={tickets} sites={sites} stats={stats} />
      )}
    </div>
  );
}
