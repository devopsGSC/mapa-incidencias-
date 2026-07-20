/**
 * Normaliza un nombre de sitio para comparar sin que importen mayúsculas ni
 * espacios de más — necesario porque osTicket tiene el mismo sitio escrito
 * de formas distintas según la lista (ej. "El Poy" en CCTV Sitios vs
 * "EL Poy" en Sitio de Aduana). NUNCA se usa este valor para mostrar ni
 * guardar: solo para decidir si dos nombres son "el mismo sitio".
 */
export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
