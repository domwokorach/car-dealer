import { FUEL_TYPES } from '@car-dealer/contracts';
import { formatPence } from '@car-dealer/utils';
import { View } from 'react-native';
import { Checkbox } from '@/components/panel/checkbox';
import { Field } from '@/components/panel/field';
import { Select } from '@/components/panel/select';
import { Switch } from '@/components/panel/switch';
import { Text } from '@/components/ui';
import { spacing } from '@/theme';
import { humanise } from '@/utils/format';
import { PRICE_CAPS, type CatalogueFilters } from '@/utils/filters';
import { useModels } from '../api/queries';

const ANY = '__any__';
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const;

export interface PanelFilters extends CatalogueFilters {
  /** Client-side: hide reserved cars. The API returns reserved listings with `available: false`. */
  availableOnly?: boolean;
}

/** Filter controls, shown inside a BottomSheet. Everything maps to a real API query parameter except `availableOnly`. */
export function FilterPanel({ filters, onChange }: { filters: PanelFilters; onChange: (next: PanelFilters) => void }) {
  const models = useModels();
  const set = <K extends keyof PanelFilters>(key: K, value: PanelFilters[K]) => onChange({ ...filters, [key]: value });
  const optional = <K extends keyof PanelFilters>(key: K) => (v: string) => set(key, (v === ANY ? undefined : v) as PanelFilters[K]);

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="muted">Condition</Text>
        <Checkbox label="New" checked={filters.condition === 'NEW'} onCheckedChange={(on) => set('condition', on ? 'NEW' : undefined)} />
        <Checkbox label="Pre-owned" checked={filters.condition === 'USED'} onCheckedChange={(on) => set('condition', on ? 'USED' : undefined)} />
      </View>

      {models.data && models.data.length > 0 ? (
        <Field>
          <Field.Title>Model</Field.Title>
          <Select value={filters.modelSlug ?? ANY} onValueChange={optional('modelSlug')} placeholder="Any model">
            <Select.Item value={ANY} label="Any model" />
            {models.data.map((m) => (
              <Select.Item key={m.id} value={m.slug} label={m.name} />
            ))}
          </Select>
        </Field>
      ) : null}

      <Field>
        <Field.Title>Fuel</Field.Title>
        <Select value={filters.fuelType ?? ANY} onValueChange={optional('fuelType')} placeholder="Any fuel">
          <Select.Item value={ANY} label="Any fuel" />
          {FUEL_TYPES.map((f) => (
            <Select.Item key={f} value={f} label={humanise(f)} />
          ))}
        </Select>
      </Field>

      <Field>
        <Field.Title>Max price</Field.Title>
        <Select
          value={filters.maxPricePounds === undefined ? ANY : String(filters.maxPricePounds)}
          onValueChange={(v) => set('maxPricePounds', v === ANY ? undefined : Number(v))}
          placeholder="Any price"
        >
          <Select.Item value={ANY} label="Any price" />
          {PRICE_CAPS.map((p) => (
            <Select.Item key={p} value={String(p)} label={formatPence(p * 100)} />
          ))}
        </Select>
      </Field>

      <Field>
        <Field.Title>Sort by</Field.Title>
        <Select value={filters.sort} onValueChange={(v) => set('sort', v as CatalogueFilters['sort'])}>
          {SORTS.map((s) => (
            <Select.Item key={s.value} value={s.value} label={s.label} />
          ))}
        </Select>
      </Field>

      <Field orientation="horizontal">
        <Field.Content>
          <Field.Title>Available only</Field.Title>
          <Field.Description>Hide cars that are currently reserved.</Field.Description>
        </Field.Content>
        <Switch
          value={!!filters.availableOnly}
          onValueChange={(v) => set('availableOnly', v)}
          accessibilityLabel="Available only"
          accessibilityHint="Hide cars that are currently reserved."
        />
      </Field>
    </View>
  );
}
