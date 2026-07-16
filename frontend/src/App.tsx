import { useMemo, useState } from "react";
import { MapHeroView } from "./components/MapHeroView";
import { MetricsView } from "./components/MetricsView";
import { NotificationStack } from "./components/NotificationStack";
import { TopBar, DashboardView } from "./components/TopBar";
import { useDashboardData } from "./hooks/useDashboardData";
import { computeSiteDepartmentBreakdown, computeSitePriorityPresence } from "./lib/siteDominance";
import { Site } from "./types";

export default function App() {
  const { sites, tickets, stats, loading, error, notifications, dismissNotification } =
    useDashboardData();
  const [view, setView] = useState<DashboardView>("map");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

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
      <TopBar view={view} onViewChange={setView} />
      <NotificationStack
        notifications={notifications}
        sites={sites}
        onDismiss={dismissNotification}
      />

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
