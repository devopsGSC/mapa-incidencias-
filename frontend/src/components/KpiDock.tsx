import { TicketStats } from "../types";

interface KpiDockProps {
  stats: TicketStats;
}

export function KpiDock({ stats }: KpiDockProps) {
  const items: { label: string; value: number; color: string; alarm?: boolean }[] = [
    { label: "Abiertos", value: stats.totalOpen, color: "var(--blue)" },
    {
      label: "Críticos",
      value: stats.totalCritical,
      color: "var(--red)",
      alarm: stats.totalCritical > 0,
    },
    { label: "Total", value: stats.total, color: "var(--cyan)" },
  ];

  return (
    <div className="fixed left-5 top-[78px] z-10 flex w-[190px] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`glass-panel px-3.5 py-3 ${item.alarm ? "critical-alarm" : ""}`}
        >
          <p className="mono-label text-[10px] text-[color:var(--muted)]">{item.label}</p>
          <p
            className="font-display mt-0.5 text-2xl font-semibold"
            style={{ color: item.color }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
