import { formatMileage, formatPence } from '@car-dealer/utils';
import type { VehicleSummary } from '@car-dealer/contracts';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Compare } from '@/components/panel/compare';
import { Select } from '@/components/panel/select';
import { Screen } from '@/components/layout/screen';
import { Badge, ErrorState, LoadingState, Text } from '@/components/ui';
import { getApi } from '@/services/api';
import { spacing } from '@/theme';
import { humanise } from '@/utils/format';

interface Row {
  label: string;
  value: (v: VehicleSummary) => string;
  /** Returns a number where lower is better (price, mileage) or higher is better (year); `undefined` = no verdict. */
  rank?: (v: VehicleSummary) => number | null;
  better?: 'lower' | 'higher';
}

const ROWS: Row[] = [
  { label: 'Price', value: (v) => formatPence(v.pricePence), rank: (v) => v.pricePence, better: 'lower' },
  { label: 'Year', value: (v) => v.registrationYear?.toString() ?? '—', rank: (v) => v.registrationYear, better: 'higher' },
  { label: 'Mileage', value: (v) => (v.mileage === null ? '—' : formatMileage(v.mileage)), rank: (v) => v.mileage, better: 'lower' },
  { label: 'Condition', value: (v) => humanise(v.condition) },
  { label: 'Fuel', value: (v) => humanise(v.fuelType) },
  { label: 'Transmission', value: (v) => humanise(v.transmission) },
  { label: 'Colour', value: (v) => v.colour ?? '—' },
  { label: 'Branch', value: (v) => `${v.branchName}, ${v.branchCity}` },
  { label: 'Availability', value: (v) => (v.available ? 'Available' : 'Reserved') },
];

function winner(row: Row, a: VehicleSummary, b: VehicleSummary): 'a' | 'b' | null {
  if (!row.rank || !row.better) return null;
  const x = row.rank(a);
  const y = row.rank(b);
  if (x === null || y === null || x === y) return null;
  return (row.better === 'lower' ? x < y : x > y) ? 'a' : 'b';
}

export default function CompareScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const [aSlug, setA] = useState(params.a);
  const [bSlug, setB] = useState(params.b);
  const list = useQuery({ queryKey: ['vehicles', 'compare-options'], queryFn: () => getApi().vehicles.list({ pageSize: 100, sort: 'newest' }) });

  if (list.isPending) return <LoadingState />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;

  const items = list.data.items;
  const a = items.find((v) => v.slug === aSlug);
  const b = items.find((v) => v.slug === bSlug);
  const options = (exclude?: string) => items.filter((v) => v.slug !== exclude);

  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Select value={aSlug} onValueChange={setA} placeholder="Choose the first car">
          {options(bSlug).map((v) => <Select.Item key={v.slug} value={v.slug} label={v.title} />)}
        </Select>
        <Select value={bSlug} onValueChange={setB} placeholder="Choose the second car">
          {options(aSlug).map((v) => <Select.Item key={v.slug} value={v.slug} label={v.title} />)}
        </Select>
      </View>

      {a && b ? (
        <>
          {a.imageUrl && b.imageUrl ? (
            <Compare height={220}>
              <Compare.After>
                <Image source={{ uri: b.imageUrl }} accessibilityLabel={b.title} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </Compare.After>
              <Compare.Before>
                <Image source={{ uri: a.imageUrl }} accessibilityLabel={a.title} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </Compare.Before>
              <Compare.Handle />
            </Compare>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Text variant="heading" style={{ flex: 1 }} numberOfLines={2}>{a.title}</Text>
            <Text variant="heading" style={{ flex: 1 }} numberOfLines={2}>{b.title}</Text>
          </View>
          {ROWS.map((row) => {
            const w = winner(row, a, b);
            return (
              <View key={row.label} className="border-b border-border" style={{ paddingBottom: spacing.md, gap: spacing.xs }}>
                <Text variant="label" tone="muted">{row.label}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  {([['a', a], ['b', b]] as const).map(([side, v]) => (
                    <View key={side} style={{ flex: 1, gap: spacing.xs }}>
                      <Text>{row.value(v)}</Text>
                      {w === side ? <Badge label={row.better === 'lower' ? 'Lower' : 'Newer'} tone="success" /> : null}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <Text tone="muted">Choose two cars to compare their price, age, mileage and specification side by side.</Text>
      )}
    </Screen>
  );
}
