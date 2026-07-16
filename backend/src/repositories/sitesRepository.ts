import { Site } from "../types";
import { SITES } from "../data/sites";

/**
 * Capa de acceso a datos de sitios. Hoy lee de un arreglo estático en
 * memoria; al migrar a osTicket real, reemplazar SitesRepository por una
 * implementación que consulte la tabla de sitios/departamentos en MySQL,
 * manteniendo la misma interfaz para no tocar rutas ni frontend.
 */
export interface SitesRepository {
  findAll(): Site[];
  findById(id: string): Site | undefined;
}

class InMemorySitesRepository implements SitesRepository {
  findAll(): Site[] {
    return SITES;
  }

  findById(id: string): Site | undefined {
    return SITES.find((site) => site.id === id);
  }
}

export const sitesRepository: SitesRepository = new InMemorySitesRepository();
