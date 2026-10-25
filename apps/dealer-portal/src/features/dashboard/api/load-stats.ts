import 'server-only';
import { STOCK_STATUSES } from '@car-dealer/contracts';
import { getApi, safely } from '@/lib/api';
import { humanise } from '@/lib/format';

/** Totals come from the API's branch-scoped endpoints, so every number respects the viewer's access. */
export async function loadDashboardStats() {
  const api = getApi();
  const [byStatus, reservations, enquiries, testDrives] = await Promise.all([
    Promise.all(
      STOCK_STATUSES.map(async (status) => ({
        label: humanise(status),
        value: (await safely(() => api.inventory.list({ status, pageSize: 1 })))?.total ?? 0,
      })),
    ),
    safely(() => api.reservations.list()),
    safely(() => api.enquiries.list()),
    safely(() => api.testDrives.list()),
  ]);

  const now = Date.now();
  return {
    stockByStatus: byStatus,
    totalStock: byStatus.reduce((n, s) => n + s.value, 0),
    activeReservations: reservations?.length ?? null,
    newEnquiries: enquiries?.filter((e) => e.status === 'NEW').length ?? null,
    upcomingTestDrives:
      testDrives?.filter((t) => t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && new Date(t.scheduledAt).getTime() > now).length ?? null,
  };
}
