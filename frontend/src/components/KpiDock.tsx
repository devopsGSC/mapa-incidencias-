import { TicketStats } from "../types";

interface KpiDockProps {
  stats: TicketStats;
  department: string;
  departments: string[];
  onDepartmentChange: (department: string) => void;
  isPending?: boolean;
}

export function KpiDock({ stats, department, departments, onDepartmentChange, isPending = false }: KpiDockProps) {
  const items: { label: string; value: number; color: string; alarm?: boolean }[] = [
    { label: "Abiertos", value: stats.totalOpen, color: "var(--blue)" },
    {
      label: "Urgentes",
      value: stats.totalUrgente,
      color: "var(--red)",
      alarm: stats.totalUrgente > 0,
    },
    { label: "Total", value: stats.total, color: "var(--cyan)" },
  ];

  return (
    <div className="fixed left-5 top-[78px] z-10 flex w-[190px] flex-col gap-2">
      <div className="glass-panel px-3.5 py-3">
        <div className="flex items-center justify-between">
          <p className="mono-label text-[10px] text-[color:var(--muted)]">Departamento</p>
          {/* Mismo texto/estilo que el "Cargando dashboard..." de App.tsx durante la carga inicial. */}
          {isPending && (
            <p className="mono-label text-[10px] text-[color:var(--muted)]">Cargando...</p>
          )}
        </div>
        <select
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="mt-1.5 w-full rounded-md border border-[color:var(--glass-border)] bg-[#0b1220] px-2 py-1 text-xs text-[color:var(--text)] outline-none focus:border-[color:var(--cyan)]"
        >
          <option value="all" className="bg-[#0b1220] text-[color:var(--text)]">
            Todos
          </option>
          {departments.map((name) => (
            <option key={name} value={name} className="bg-[#0b1220] text-[color:var(--text)]">
              {name}
            </option>
          ))}
        </select>
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className={`glass-panel px-3.5 py-3 transition-opacity duration-200 ${
            item.alarm ? "urgente-alarm" : ""
          } ${isPending ? "opacity-50" : "opacity-100"}`}
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
