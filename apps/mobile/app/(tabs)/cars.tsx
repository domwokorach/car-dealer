import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/panel/bottom-sheet';
import { Badge as CountBadge } from '@/components/panel/badge';
import { SearchBar } from '@/components/panel/search-bar';
import { Button, Text } from '@/components/ui';
import { useVehicles } from '@/features/catalogue/api/queries';
import { FilterPanel, type PanelFilters } from '@/features/catalogue/components/filter-panel';
import { VehicleList } from '@/features/catalogue/components/vehicle-list';
import { spacing } from '@/theme';
import { activeFilterCount } from '@/utils/filters';

export default function CarsScreen() {
  const [filters, setFilters] = useState<PanelFilters>({ sort: 'newest' });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { availableOnly, ...apiFilters } = filters;
  const query = useVehicles(apiFilters);
  const count = activeFilterCount(apiFilters) + (availableOnly ? 1 : 0);
  const term = search.trim().toLowerCase();

  // The API has no free-text search: filter what's loaded, and keep paging while a search is active.
  useEffect(() => {
    if (term && query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [term, query]);

  const shown = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages.map((p) => ({
      ...p,
      items: p.items.filter((v) => (!availableOnly || v.available) && (!term || `${v.title} ${v.colour ?? ''} ${v.fuelType}`.toLowerCase().includes(term))),
    }));
  }, [query.data, availableOnly, term]);
  const total = shown.reduce((n, p) => n + p.items.length, 0);

  return (
    <>
      <VehicleList
        query={{ ...query, data: query.data && { ...query.data, pages: shown } } as typeof query}
        header={
          <View style={{ gap: spacing.lg, marginBottom: spacing.sm }}>
            <SearchBar placeholder="Search make, model or colour" value={search} onChangeText={setSearch} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text tone="muted">{query.isPending ? ' ' : `${total} vehicle${total === 1 ? '' : 's'}${term && query.hasNextPage ? '…' : ''}`}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                {count > 0 ? <Button title="Clear" variant="ghost" onPress={() => { setFilters({ sort: filters.sort }); setSearch(''); }} /> : null}
                <Button title="Filters" variant="secondary" onPress={() => setOpen(true)} />
                {count > 0 ? <CountBadge count={count} shape="count" variant="default" /> : null}
              </View>
            </View>
          </View>
        }
      />
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheet.Content size="full">
          <BottomSheet.Header>
            <Text variant="title">Filters</Text>
          </BottomSheet.Header>
          <BottomSheet.Body>
            <FilterPanel filters={filters} onChange={setFilters} />
          </BottomSheet.Body>
          <BottomSheet.Footer>
            <Button title={`Show ${total} vehicle${total === 1 ? '' : 's'}`} onPress={() => setOpen(false)} />
          </BottomSheet.Footer>
        </BottomSheet.Content>
      </BottomSheet>
    </>
  );
}
