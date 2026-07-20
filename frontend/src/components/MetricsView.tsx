import { StatusChart } from "./StatusChart";
import { TicketsTable } from "./TicketsTable";
import { TrendChart } from "./TrendChart";
import { Site, Ticket, TicketStats } from "../types";

interface MetricsViewProps {
  tickets: Ticket[];
  sites: Site[];
  stats: TicketStats;
}

export function MetricsView({ tickets, sites, stats }: MetricsViewProps) {
  return (
    <div className="thin-scroll h-full overflow-y-auto px-5 pb-6 pt-[92px]">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4">
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StatusChart stats={stats} />
          <TrendChart stats={stats} />
        </section>

        <section>
          <TicketsTable tickets={tickets} sites={sites} />
        </section>
      </div>
    </div>
  );
}
