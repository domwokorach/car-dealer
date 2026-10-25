import { formatPence } from '@car-dealer/utils';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Suspense, lazy, useState } from 'react';
import { View } from 'react-native';
import { Accordion } from '@/components/panel/accordion';
import { Tabs } from '@/components/panel/tabs';
import { Timeline } from '@/components/panel/timeline';
import { Screen } from '@/components/layout/screen';
import { Skeleton } from '@/components/panel/skeleton';
import { Badge, Button, ErrorState, LoadingState, Text } from '@/components/ui';
import { SpecList } from '@/components/vehicles/spec-list';
import { VehicleGallery } from '@/components/vehicles/vehicle-gallery';
import { useVehicle } from '@/features/catalogue/api/queries';
import { FavouriteButton } from '@/features/favourites/components/favourite-button';
import { spacing } from '@/theme';

// The 3D engine is only loaded when the 360° tab is first opened.
const Vehicle360Panel = lazy(() => import('@/features/vehicle-3d/components/vehicle-360-panel').then((m) => ({ default: m.Vehicle360Panel })));

/** The buying journey, as described by the reservation flow: nothing here is charged or promised beyond it. */
const JOURNEY = [
  ['Reserve online', 'We hold the car and lock in today’s price. Nothing is charged online.'],
  ['Your branch gets in touch', 'The branch confirms details and arranges collection.'],
  ['Collect locally', 'Collect your car from the branch it is held at.'],
] as const;

export default function VehicleScreen() {
  const { slug, tab } = useLocalSearchParams<{ slug: string; tab?: string }>();
  const query = useVehicle(slug);
  // `?tab=360` opens straight on the 360° view (the home header's "View in 360°" uses it).
  const [media, setMedia] = useState<'photos' | '360'>(tab === '360' ? '360' : 'photos');
  const [turning, setTurning] = useState(false);

  if (query.isPending) return <><Stack.Screen options={{ title: '' }} /><LoadingState /></>;
  if (query.isError || !query.data) return <><Stack.Screen options={{ title: '' }} /><ErrorState error={query.error} onRetry={() => void query.refetch()} /></>;

  const v = query.data;
  const params = { vehicleId: v.listingId, title: v.title };

  return (
    <>
      <Stack.Screen options={{ title: v.modelName, headerRight: () => <FavouriteButton listingId={v.listingId} returnTo={`/cars/${v.slug}`} /> }} />
      <Screen
        padded={false}
        scrollEnabled={!turning}
        contentStyle={{ gap: spacing.xl }}
        footer={
          <View style={{ gap: spacing.md }}>
            <Button title={v.available ? 'Reserve this car' : 'Currently reserved'} disabled={!v.available} onPress={() => router.push({ pathname: '/reservation/[vehicleId]', params })} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Test drive" variant="secondary" onPress={() => router.push({ pathname: '/test-drive/[vehicleId]', params })} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Enquire" variant="secondary" onPress={() => router.push({ pathname: '/enquiry/[vehicleId]', params })} />
              </View>
            </View>
          </View>
        }
      >
        <Tabs defaultValue={media} value={media} onValueChange={(next) => setMedia(next === '360' ? '360' : 'photos')}>
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
            <Tabs.List>
              <Tabs.Trigger value="photos">Photos</Tabs.Trigger>
              <Tabs.Trigger value="360">360° View</Tabs.Trigger>
            </Tabs.List>
          </View>
          <Tabs.Content value="photos">
            <VehicleGallery images={v.images} title={v.title} />
          </Tabs.Content>
          <Tabs.Content value="360">
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-none" />}>
              <Vehicle360Panel
                slug={v.slug}
                title={v.title}
                images={v.images}
                selected={media === '360'}
                onInteractionChange={setTurning}
                onShowPhotos={() => setMedia('photos')}
              />
            </Suspense>
          </Tabs.Content>
        </Tabs>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xl }}>
          <View style={{ gap: spacing.sm }}>
            <Badge label={v.available ? 'Available' : 'Reserved'} tone={v.available ? 'success' : 'warning'} />
            <Text variant="title">{v.title}</Text>
            <Text variant="price">{formatPence(v.pricePence)}</Text>
            <Text tone="muted" onPress={() => router.push({ pathname: '/branches/[slug]', params: { slug: v.branchId } })}>
              At {v.branchName}, {v.branchCity}
            </Text>
          </View>

          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="specification">Specification</Tabs.Trigger>
              <Tabs.Trigger value="buying">Buying</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview">
              <View style={{ gap: spacing.lg, paddingTop: spacing.lg }}>
                <Text tone={v.description ? 'default' : 'muted'}>{v.description ?? 'No description has been added for this car yet.'}</Text>
                <Button title="Compare with another car" variant="secondary" onPress={() => router.push({ pathname: '/compare', params: { a: v.slug } })} />
              </View>
            </Tabs.Content>
            <Tabs.Content value="specification">
              <View style={{ paddingTop: spacing.sm }}>
                <SpecList vehicle={v} />
              </View>
            </Tabs.Content>
            <Tabs.Content value="buying">
              <View style={{ gap: spacing.lg, paddingTop: spacing.lg }}>
                <Timeline value={0}>
                  {JOURNEY.map(([title, body], i) => (
                    <Timeline.Item key={title} step={i}>
                      <Timeline.Indicator />
                      <Timeline.Content>
                        <Timeline.Title>{title}</Timeline.Title>
                        <Timeline.Description>{body}</Timeline.Description>
                      </Timeline.Content>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </View>
            </Tabs.Content>
          </Tabs>

          <Accordion selectionMode="single" defaultValue="location">
            <Accordion.Item value="location">
              <Accordion.Trigger>
                <Accordion.Title>Where this car is</Accordion.Title>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <Text tone="muted">{v.branchName}, {v.branchCity}. Open the branch for its address, phone number and directions.</Text>
                <View style={{ marginTop: spacing.md }}>
                  <Button title="View branch" variant="secondary" onPress={() => router.push({ pathname: '/branches/[slug]', params: { slug: v.branchId } })} />
                </View>
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="price">
              <Accordion.Trigger>
                <Accordion.Title>Price lock</Accordion.Title>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <Text tone="muted">If you reserve this car, its price is locked in for you, even if the advertised price changes afterwards.</Text>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </View>
      </Screen>
    </>
  );
}
