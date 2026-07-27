import { useEffect, useMemo, useRef, useState } from "react";
import { DetailDrawer } from "./DetailDrawer";
import { KpiDock } from "./KpiDock";
import { MapView } from "./MapView";
import { SiteRail } from "./SiteRail";
import { computeStats } from "../lib/computeStats";
import { computeSiteDepartmentBreakdown, computeSitePriorityPresence } from "../lib/siteDominance";
import { Site, Ticket } from "../types";

interface MapHeroViewProps {
  sites: Site[];
  tickets: Ticket[];
  selectedSite: Site | null;
  onSelectSite: (site: Site | null) => void;
}

const APPLY_DELAY_MS = 400;

export function MapHeroView({ sites, tickets, selectedSite, onSelectSite }: MapHeroViewProps) {
  // department: el filtro que efectivamente se usa para recalcular KPIs/
  // marcadores. selectValue: lo que el <select> muestra al toque, para que
  // no "vuelva" a la opción anterior mientras el delay corre.
  const [department, setDepartment] = useState<string>("all");
  const [selectValue, setSelectValue] = useState<string>("all");
  const [isPending, setIsPending] = useState(false);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(applyTimeoutRef.current), []);

  // El recálculo real (computeStats/dominancia) sobre el volumen actual de
  // tickets es prácticamente instantáneo — tan rápido que un
  // indicador "de verdad" (ej. useTransition) nunca llega a pintarse antes
  // de que termine. Este delay es deliberado, solo para que el "Cargando..."
  // sea visible una fracción de segundo antes de aplicar el filtro.
  const handleDepartmentChange = (next: string) => {
    setSelectValue(next);
    setIsPending(true);
    clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      setDepartment(next);
      setIsPending(false);
    }, APPLY_DELAY_MS);
  };

  // En vivo a partir de los tickets ya cargados (mismo criterio del proyecto:
  // nunca hardcodear la lista de departamentos) — así solo aparecen opciones
  // que el usuario autenticado realmente puede ver.
  const departments = useMemo(() => {
    return Array.from(new Set(tickets.map((ticket) => ticket.department))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return department === "all" ? tickets : tickets.filter((ticket) => ticket.department === department);
  }, [tickets, department]);

  // KPIs, marcadores y detalle de sitio se recalculan sobre el set filtrado
  // — mismo patrón que ya usa useDashboardData para no depender de un
  // round-trip al backend en cada cambio de filtro.
  const stats = useMemo(() => computeStats(filteredTickets, sites), [filteredTickets, sites]);
  const departmentBreakdownBySite = useMemo(
    () => computeSiteDepartmentBreakdown(filteredTickets),
    [filteredTickets]
  );
  const sitePriorityPresenceById = useMemo(
    () => computeSitePriorityPresence(filteredTickets),
    [filteredTickets]
  );
  const siteStatsById = useMemo(() => {
    const map = new Map<string, (typeof stats.bySite)[number]>();
    stats.bySite.forEach((entry) => map.set(entry.siteId, entry));
    return map;
  }, [stats.bySite]);

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

      <KpiDock
        stats={stats}
        department={selectValue}
        departments={departments}
        onDepartmentChange={handleDepartmentChange}
        isPending={isPending}
      />
      <SiteRail
        sites={sites}
        siteStatsById={siteStatsById}
        selectedSiteId={selectedSite?.id}
        onSelectSite={onSelectSite}
      />

      {selectedSite ? (
        <DetailDrawer
          site={selectedSite}
          tickets={filteredTickets}
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
      <LegendRow color="var(--fill-danger)" label="Urgente" />
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
