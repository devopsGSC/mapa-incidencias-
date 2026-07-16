import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { CountryBoundary } from "./CountryBoundary";
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

const EL_SALVADOR_CENTER: [number, number] = [13.79, -88.92];

const EMPTY_PRESENCE: PriorityPresence = {
  low: false,
  normal: false,
  high: false,
  critical: false,
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
      center={EL_SALVADOR_CENTER}
      zoom={9}
      minZoom={8}
      zoomControl={false}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <CountryBoundary />
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
