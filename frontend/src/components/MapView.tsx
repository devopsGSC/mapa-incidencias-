import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { CountryBoundary } from "./CountryBoundary";
import { MapZoomControls } from "./MapZoomControls";
import { countryFitOptions, EL_SALVADOR_BOUNDS } from "../lib/mapFraming";
import { buildSiteMarkerIcon } from "../lib/siteMarkerIcon";
import { DepartmentCount, PriorityPresence } from "../lib/siteDominance";
import { Site } from "../types";

interface MapViewProps {
  sites: Site[];
  departmentBreakdownBySite: Map<string, DepartmentCount[]>;
  sitePriorityPresenceById: Map<string, PriorityPresence>;
  selectedSiteId?: string;
  onSelectSite: (site: Site) => void;
}

const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY;
const CARTO_TILE_URL = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${
  CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : ""
}`;

const EMPTY_PRESENCE: PriorityPresence = {
  low: false,
  normal: false,
  high: false,
  urgente: false,
};

export function MapView({
  sites,
  departmentBreakdownBySite,
  sitePriorityPresenceById,
  selectedSiteId,
  onSelectSite,
}: MapViewProps) {
  return (
    <MapContainer
      bounds={EL_SALVADOR_BOUNDS}
      boundsOptions={countryFitOptions()}
      zoomSnap={0.25}
      minZoom={8}
      zoomControl={false}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={CARTO_TILE_URL}
      />
      <CountryBoundary />
      {/* zoomControl nativo desactivado por estética; estos botones grandes
          son necesarios en navegadores de TV, que no tienen rueda ni pinch. */}
      <MapZoomControls homeBounds={EL_SALVADOR_BOUNDS} />
      {sites.map((site) => {
        const departmentCounts = departmentBreakdownBySite.get(site.id) ?? [];
        const priorityPresence = sitePriorityPresenceById.get(site.id) ?? EMPTY_PRESENCE;
        const isSelected = site.id === selectedSiteId;

        return (
          <Marker
            key={site.id}
            position={[site.lat, site.lng]}
            icon={buildSiteMarkerIcon(departmentCounts, priorityPresence, isSelected, site.id)}
            eventHandlers={{ click: () => onSelectSite(site) }}
          />
        );
      })}
    </MapContainer>
  );
}
