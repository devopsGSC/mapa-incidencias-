import type { FitBoundsOptions, LatLngBoundsExpression } from "leaflet";
import { getHudScale } from "./hudScale";

// Encuadre inicial: todo el país, sea cual sea el tamaño de pantalla (los
// navegadores de TV reportan viewports chicos y con zoom fijo el país no
// entraba completo).
export const EL_SALVADOR_BOUNDS: LatLngBoundsExpression = [
  [13.15, -90.13],
  [14.45, -87.68],
];

// Margen para que el país quede en el hueco libre entre los paneles
// flotantes (KPIs a la izquierda, lista de sitios a la derecha, barra arriba),
// escalado igual que ellos.
export function countryFitOptions(): FitBoundsOptions {
  const scale = getHudScale();
  return {
    paddingTopLeft: [220 * scale, 70 * scale],
    paddingBottomRight: [310 * scale, 20 * scale],
  };
}
