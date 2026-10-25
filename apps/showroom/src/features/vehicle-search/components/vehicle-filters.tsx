import type { Branch, VehicleModel } from '@car-dealer/contracts';
import { FUEL_TYPES } from '@car-dealer/contracts';
import { Button, Field, Input, Select } from '@car-dealer/ui-web';
import type { SearchParams } from '@/types/search-params';

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** A plain GET form: works without JavaScript and keeps filters in the URL (shareable, back-button friendly). */
export function VehicleFilters({
  action,
  params,
  models,
  branches,
}: {
  action: string;
  params: SearchParams;
  models: VehicleModel[];
  branches: Branch[];
}) {
  return (
    <form action={action} method="get" className="grid gap-4 border border-silver/60 p-5 sm:grid-cols-2 lg:grid-cols-6" aria-label="Filter vehicles">
      <Field label="Model" htmlFor="model">
        <Select id="model" name="model" defaultValue={first(params.model)}>
          <option value="">All models</option>
          {models.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fuel" htmlFor="fuel">
        <Select id="fuel" name="fuel" defaultValue={first(params.fuel)}>
          <option value="">Any</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {label(f)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Branch" htmlFor="branch">
        <Select id="branch" name="branch" defaultValue={first(params.branch)}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Min price (£)" htmlFor="min">
        <Input id="min" name="min" type="number" min={0} step={1000} inputMode="numeric" defaultValue={first(params.min)} />
      </Field>
      <Field label="Max price (£)" htmlFor="max">
        <Input id="max" name="max" type="number" min={0} step={1000} inputMode="numeric" defaultValue={first(params.max)} />
      </Field>
      <Field label="Sort" htmlFor="sort">
        <Select id="sort" name="sort" defaultValue={first(params.sort)}>
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </Select>
      </Field>
      <div className="sm:col-span-2 lg:col-span-6">
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}
