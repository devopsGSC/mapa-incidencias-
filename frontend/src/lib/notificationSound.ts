import { TicketPriority } from "../types";

const MUTE_STORAGE_KEY = "ticketSoundMuted";

function readStoredMute(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
}

let muted = readStoredMute();
const muteListeners = new Set<(muted: boolean) => void>();

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(next: boolean) {
  muted = next;
  window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
  muteListeners.forEach((listener) => listener(muted));
}

export function subscribeSoundMuted(listener: (muted: boolean) => void): () => void {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

// Un solo AudioContext compartido para toda la sesión — crear uno por
// notificación es innecesario y algunos navegadores limitan cuántos se
// pueden tener abiertos a la vez.
let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();

    // Los navegadores arrancan el AudioContext "suspended" hasta el primer
    // gesto del usuario (click/tecla). En un dashboard que se mira pasivo en
    // una TV, eso puede tardar — así que apenas haya cualquier interacción
    // lo reactivamos, sin bloquear ni pedir permiso explícito.
    const resume = () => {
      audioCtx?.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
  }

  return audioCtx;
}

/** Se llama desde el click del botón de sonido: ese gesto es lo que el navegador exige para desbloquear el audio. */
export function primeAudio() {
  getContext()?.resume().catch(() => {});
}

/** Campanada corta de dos tonos: más aguda y un pelo más fuerte para prioridades urgentes. */
export function playTicketChime(priority: TicketPriority) {
  if (muted) return;

  const ctx = getContext();
  if (!ctx || ctx.state === "suspended") return;

  const isUrgent = priority === "urgente" || priority === "high";
  const freqs = isUrgent ? [880, 1108.73] : [660, 880];
  const peakGain = isUrgent ? 0.22 : 0.14;
  const now = ctx.currentTime;

  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const start = now + index * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}
