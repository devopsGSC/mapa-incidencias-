import { Site } from "../types";
import sitesData from "../data/sites.json";

/**
 * Capa de acceso a datos de sitios. osTicket no tiene coordenadas
 * geográficas, así que la fuente de verdad es este archivo estático
 * (data/sites.json), cuyos IDs deben coincidir con ost_list_items
 * (list_id = 2) para poder cruzar los tickets con su sitio real.
 */
export interface SitesRepository {
  findAll(): Site[];
  findById(id: string): Site | undefined;
}

const SITES: Site[] = sitesData.sites.map((site) => ({
  id: String(site.id),
  name: site.name,
  type: site.type as Site["type"],
  lat: site.lat,
  lng: site.lng,
}));

class JsonSitesRepository implements SitesRepository {
  findAll(): Site[] {
    return SITES;
  }

  findById(id: string): Site | undefined {
    return SITES.find((site) => site.id === id);
  }
}

export const sitesRepository: SitesRepository = new JsonSitesRepository();
