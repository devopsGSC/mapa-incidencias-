import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  /** Único uso permitido de color en el panel admin: rol "Administrador". Todo lo demás (tipo de sitio, rol "Usuario") es gris neutro. */
  accent?: boolean;
}

export function Badge({ children, accent = false }: BadgeProps) {
  return (
    <span
      className="mono-label inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium"
      style={{
        border: `0.5px solid ${accent ? "var(--border-accent)" : "var(--border-strong)"}`,
        color: accent ? "var(--text-accent)" : "var(--text-secondary)",
      }}
    >
      {children}
    </span>
  );
}
