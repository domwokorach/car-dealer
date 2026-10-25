import { Stat } from '@car-dealer/ui-web';
import { StatusBreakdown } from '@/components/charts/status-breakdown';
import { loadDashboardStats } from '../api/load-stats';

const show = (n: number | null) => (n === null ? '—' : n);

export async function DashboardOverview() {
  const s = await loadDashboardStats();
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Vehicles in stock" value={s.totalStock} />
        <Stat label="Active reservations" value={show(s.activeReservations)} />
        <Stat label="New enquiries" value={show(s.newEnquiries)} />
        <Stat label="Upcoming test drives" value={show(s.upcomingTestDrives)} />
      </div>
      <StatusBreakdown title="Stock by status" slices={s.stockByStatus} />
    </div>
  );
}
