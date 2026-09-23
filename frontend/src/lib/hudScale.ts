// Escala los paneles flotantes (clase .hud-scale) según el tamaño real de la
// ventana. El layout está pensado para ~1280x650 o más; los navegadores de TV
// suelen reportar un viewport chico (ej. 960x540 con devicePixelRatio alto) y
// ahí los paneles se pisan entre sí y tapan el mapa. En pantallas realmente
// grandes (viewport 4K) pasa lo contrario y se agrandan.
//
// Se usa CSS `zoom` solo en los paneles, nunca en el contenedor de Leaflet:
// con zoom en un ancestro del mapa, las coordenadas de clic/arrastre quedan
// desfasadas en varios navegadores.
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 650;
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

function computeHudScale(width: number, height: number): number {
  const shrink = Math.min(width / MIN_WIDTH, height / MIN_HEIGHT);
  const scale = shrink < 1 ? shrink : Math.max(1, Math.min(width / BASE_WIDTH, height / BASE_HEIGHT));
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function getHudScale(): number {
  return computeHudScale(window.innerWidth, window.innerHeight);
}

function applyHudScale() {
  const scale = getHudScale();
  document.documentElement.style.setProperty("--hud-zoom", scale.toFixed(3));
}

export function initHudScale() {
  applyHudScale();
  window.addEventListener("resize", applyHudScale);
}
