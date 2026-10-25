import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { Skeleton } from '@/components/panel/skeleton';
import { Button, Text } from '@/components/ui';
import { openVehicle } from '@/features/catalogue/components/vehicle-list';
import { colors, spacing } from '@/theme';
import { useFeaturedVehicles } from '../api/queries';
import { heroHeight, heroTextWidth, selectSlides } from '../lib/hero';
import { FeaturedCarCarousel } from './featured-car-carousel';
import { HeroSearchBar } from './hero-search-bar';
import { HeroShowroom } from './hero-showroom';

const enter = (delay: number) => FadeInDown.duration(500).delay(delay).reduceMotion(ReduceMotion.System);

/**
 * Home hero: featured-vehicle photography under fixed brand copy and two actions, with the search bar below.
 * The hero is deliberately dark in both themes (photography + scrim); everything below it follows the theme.
 */
export function CarHeroHeader() {
  const { width } = useWindowDimensions();
  const height = heroHeight(width);
  const featured = useFeaturedVehicles();
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const slides = useMemo(() => selectSlides(featured.data?.items ?? [], failed), [featured.data, failed]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showroomOpen, setShowroomOpen] = useState(false);
  const featuredVehicle = slides[Math.min(activeIndex, Math.max(slides.length - 1, 0))];
  const onImageError = useCallback((url: string) => setFailed((prev) => new Set(prev).add(url)), []);

  return (
    <View style={{ gap: spacing.lg }}>
      <View
        style={{ height, backgroundColor: colors.ink, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' }}
        accessibilityRole="header"
      >
        {slides.length > 0 ? (
          <FeaturedCarCarousel vehicles={slides} width={width} height={height} onSelect={(v) => openVehicle(v.slug)} onImageError={onImageError} onIndexChange={setActiveIndex} />
        ) : (
          // No photography yet (loading, offline, or nothing uploaded): a brand backdrop, never a broken image.
          <LinearGradient colors={[colors.steel, colors.graphite, colors.ink]} style={StyleSheet.absoluteFill} />
        )}

        {/* Copy and actions sit above the photos; only the buttons take touches so swiping still works everywhere else. */}
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: spacing.xl, paddingBottom: 132 }]}>
          <View pointerEvents="box-none" style={{ gap: spacing.md, maxWidth: heroTextWidth(width) }}>
            <Animated.View entering={enter(0)} pointerEvents="none">
              <Text variant="label" style={{ color: colors.accent }}>
                Car Dealer
              </Text>
            </Animated.View>
            <Animated.View entering={enter(80)} pointerEvents="none" style={{ gap: spacing.sm }}>
              <Text variant="display" tone="inverse" accessibilityRole="header">
                Find Your Dream Car
              </Text>
              <Text tone="inverse" style={{ opacity: 0.85 }}>
                Explore every angle before you drive.
              </Text>
            </Animated.View>
            <Animated.View entering={enter(160)} style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Button title="Explore Cars" variant="inverse" onPress={() => router.push('/cars')} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="View in 360°"
                  variant="secondary"
                  disabled={!featuredVehicle}
                  accessibilityHint="Opens a full-screen interactive view of the featured car"
                  onPress={() => setShowroomOpen(true)}
                />
              </View>
            </Animated.View>
          </View>
        </View>

        {slides.length === 0 ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 40 }}>
            {featured.isPending ? (
              <Skeleton className="h-14 w-full rounded-xl" />
            ) : featured.isError ? (
              <Button title="Featured cars unavailable · Retry" variant="ghost" onPress={() => void featured.refetch()} />
            ) : null}
          </View>
        ) : null}
      </View>

      <HeroSearchBar />
      <HeroShowroom vehicle={featuredVehicle} visible={showroomOpen} onClose={() => setShowroomOpen(false)} />
    </View>
  );
}
