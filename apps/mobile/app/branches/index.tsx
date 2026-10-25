import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { BottomSheet } from '@/components/panel/bottom-sheet';
import { Card } from '@/components/panel/card';
import { Screen } from '@/components/layout/screen';
import { Button, EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { useBranches } from '@/features/catalogue/api/queries';
import { branchAddress, useBranchCoordinates } from '@/features/locations/api/coordinates';
import { BranchMap } from '@/features/locations/components/branch-map';
import { spacing } from '@/theme';

export default function BranchesScreen() {
  const branches = useBranches();
  const coords = useBranchCoordinates(branches.data);
  const [selectedId, setSelectedId] = useState<string>();
  const selected = branches.data?.find((b) => b.id === selectedId);

  if (branches.isPending) return <LoadingState />;
  if (branches.isError) return <ErrorState error={branches.error} onRetry={() => void branches.refetch()} />;
  if (branches.data.length === 0) return <EmptyState title="No branches yet" />;

  const directions = (b: NonNullable<typeof selected>) => {
    const q = encodeURIComponent(branchAddress(b));
    return Platform.select({ ios: `https://maps.apple.com/?q=${q}`, default: `https://www.google.com/maps/search/?api=1&query=${q}` });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Our branches' }} />
      <Screen>
        <BranchMap branches={branches.data} coordinates={coords.byId} selectedId={selectedId} onSelect={(b) => setSelectedId(b.id)} height={340} />
        {branches.data.map((b) => (
          <Card key={b.id}>
            <Card.Header>
              <Card.Title>{b.name}</Card.Title>
              <Card.Description>{`${b.addressLine1}, ${b.city} ${b.postcode}`}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <View style={{ flexDirection: 'row', gap: spacing.md, flex: 1 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Details" variant="secondary" onPress={() => setSelectedId(b.id)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Cars here" onPress={() => router.push({ pathname: '/branches/[slug]', params: { slug: b.code.toLowerCase() } })} />
                </View>
              </View>
            </Card.Footer>
          </Card>
        ))}
      </Screen>

      <BottomSheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(undefined)}>
        <BottomSheet.Content>
          {selected ? (
            <>
              <BottomSheet.Header>
                <Text variant="title">{selected.name}</Text>
                <Text tone="muted">{`${selected.addressLine1}, ${selected.city} ${selected.postcode}`}</Text>
              </BottomSheet.Header>
              <BottomSheet.Body>
                <View style={{ gap: spacing.md }}>
                  <Button title="Get directions" onPress={() => void Linking.openURL(directions(selected))} />
                  {selected.phone ? <Button title={`Call ${selected.phone}`} variant="secondary" onPress={() => void Linking.openURL(`tel:${selected.phone?.replace(/\s+/g, '')}`)} /> : null}
                  <Button title="See cars at this branch" variant="secondary" onPress={() => { setSelectedId(undefined); router.push({ pathname: '/branches/[slug]', params: { slug: selected.code.toLowerCase() } }); }} />
                </View>
              </BottomSheet.Body>
            </>
          ) : null}
        </BottomSheet.Content>
      </BottomSheet>
    </>
  );
}
