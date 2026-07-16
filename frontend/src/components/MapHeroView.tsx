import { DetailDrawer } from "./DetailDrawer";
import { KpiDock } from "./KpiDock";
import { MapView } from "./MapView";
import { SiteRail } from "./SiteRail";
import { DepartmentCount, PriorityPresence } from "../lib/siteDominance";
import { Site, SiteStat, Ticket, TicketStats } from "../types";

interface MapHeroViewProps {
  sites: Site[];
  tickets: Ticket[];
  stats: TicketStats;
  siteStatsById: Map<string, SiteStat>;
  departmentBreakdownBySite: Map<string, DepartmentCount[]>;
  sitePriorityPresenceById: Map<string, PriorityPresence>;
  selectedSite: Site | null;
  onSelectSite: (site: Site | null) => void;
}

export function MapHeroView({
  sites,
  tickets,
  stats,
  siteStatsById,
  departmentBreakdownBySite,
  sitePriorityPresenceById,
  selectedSite,
  onSelectSite,
}: MapHeroViewProps) {
  return (
    <div className="relative h-full w-full">
      {/* z-0 crea un stacking context propio: las capas internas de Leaflet
          (marcadores, controles, atribución) usan z-index de hasta 1000,
          pero quedan atrapadas dentro de este contexto y no pueden
          escaparse por encima de los paneles flotantes (KPI, rail, drawer). */}
      <div className="absolute inset-0 z-0">
        <MapView
          sites={sites}
          departmentBreakdownBySite={departmentBreakdownBySite}
          sitePriorityPresenceById={sitePriorityPresenceById}
          selectedSiteId={selectedSite?.id}
          onSelectSite={onSelectSite}
        />
      </div>

      <KpiDock stats={stats} />
      <SiteRail
        sites={sites}
        siteStatsById={siteStatsById}
        selectedSiteId={selectedSite?.id}
        onSelectSite={onSelectSite}
      />

      {selectedSite ? (
        <DetailDrawer
          site={selectedSite}
          tickets={tickets}
          onClose={() => onSelectSite(null)}
        />
      ) : (
        <MapLegend />
      )}
    </div>
  );
}

function MapLegend() {
  return (
    <div className="glass-panel fixed bottom-5 left-5 z-10 px-3.5 py-3 text-xs text-[color:var(--muted)]">
      <p className="mono-label mb-1.5 text-[10px] text-[color:var(--text)]">
        Aro = prioridades abiertas
      </p>
      <LegendRow color="var(--fill-danger)" label="Crítica" />
      <LegendRow color="var(--fill-warning)" label="Alta" />
      <LegendRow color="var(--fill-accent)" label="Normal" />
      <LegendRow color="var(--fill-success)" label="Baja" />
      <LegendRow color="var(--border)" label="Sin tickets de esa prioridad" />
      <p className="mono-label mt-2 text-[9.5px] text-[color:var(--muted-2)]">
        Clic en un marcador o sitio para ver detalle
      </p>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
