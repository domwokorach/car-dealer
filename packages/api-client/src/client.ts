import { z } from 'zod';
import {
  AuditEventPageSchema,
  BranchSchema,
  EnquirySchema,
  HealthSchema,
  OrderSchema,
  ReservationSchema,
  SessionUserSchema,
  StaffMembershipSchema,
  StockVehiclePageSchema,
  TestDriveSchema,
  TransferSchema,
  VehicleDetailSchema,
  VehicleModelSchema,
  VehicleSummarySchema,
  VehicleSummaryPageSchema,
  type CreateReservationInput,
  type EnquiryCreateInput,
  type ListAuditQuery,
  type ListStockQuery,
  type ListVehiclesQuery,
  type TestDriveCreateInput,
} from '@car-dealer/contracts';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Called per request; return the user's access token, or null for anonymous calls. */
  getToken?: () => Promise<string | null> | string | null;
  fetch?: typeof fetch;
}

type Query = Record<string, string | number | boolean | undefined>;

export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? fetch;
  const base = options.baseUrl.replace(/\/$/, '');

  async function request<S extends z.ZodTypeAny>(
    schema: S,
    path: string,
    init: { method?: string; query?: Query; body?: unknown; auth?: boolean } = {},
  ): Promise<z.infer<S>> {
    const url = new URL(`${base}${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    if (init.auth) {
      const token = await options.getToken?.();
      if (!token) throw new ApiError(401, 'Not signed in');
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await doFetch(url, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        json && typeof json === 'object' && 'message' in json ? String(json.message) : res.statusText;
      throw new ApiError(res.status, message);
    }
    return schema.parse(json);
  }

  const authed = { auth: true } as const;

  return {
    health: () => request(HealthSchema, '/health'),
    me: () => request(SessionUserSchema, '/me', authed),

    // Public showroom
    vehicles: {
      list: (query: Partial<ListVehiclesQuery> = {}) => request(VehicleSummaryPageSchema, '/vehicles', { query }),
      get: (slug: string) => request(VehicleDetailSchema, `/vehicles/${encodeURIComponent(slug)}`),
    },
    models: { list: () => request(z.array(VehicleModelSchema), '/models') },
    branches: { list: () => request(z.array(BranchSchema), '/branches') },
    enquiries: {
      create: (input: EnquiryCreateInput) =>
        request(z.object({ id: z.string() }), '/enquiries', { method: 'POST', body: input }),
      list: () => request(z.array(EnquirySchema), '/enquiries', authed),
    },

    // Signed-in customer
    savedListings: {
      list: () => request(z.array(VehicleSummarySchema), '/saved-listings', authed),
      save: (listingId: string) => request(z.object({ saved: z.boolean() }), `/saved-listings/${listingId}`, { method: 'PUT', ...authed }),
      remove: (listingId: string) =>
        request(z.object({ saved: z.boolean() }), `/saved-listings/${listingId}`, { method: 'DELETE', ...authed }),
    },
    testDrives: {
      create: (input: TestDriveCreateInput) => request(TestDriveSchema, '/test-drives', { method: 'POST', body: input, ...authed }),
      mine: () => request(z.array(TestDriveSchema), '/test-drives/mine', authed),
      list: () => request(z.array(TestDriveSchema), '/test-drives', authed),
    },
    reservations: {
      create: (input: CreateReservationInput) =>
        request(ReservationSchema, '/reservations', { method: 'POST', body: input, ...authed }),
      mine: () => request(z.array(ReservationSchema), '/reservations/mine', authed),
      list: () => request(z.array(ReservationSchema), '/reservations', authed),
    },
    orders: {
      mine: () => request(z.array(OrderSchema), '/orders/mine', authed),
      list: () => request(z.array(OrderSchema), '/orders', authed),
    },

    // Staff
    inventory: {
      list: (query: Partial<ListStockQuery> = {}) => request(StockVehiclePageSchema, '/inventory', { query, ...authed }),
    },
    transfers: { list: () => request(z.array(TransferSchema), '/transfers', authed) },
    staff: { list: () => request(z.array(StaffMembershipSchema), '/staff', authed) },
    audit: {
      list: (query: Partial<ListAuditQuery> = {}) => request(AuditEventPageSchema, '/audit', { query, ...authed }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
