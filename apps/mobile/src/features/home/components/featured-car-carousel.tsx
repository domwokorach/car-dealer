import type { VehicleSummary } from '@car-dealer/contracts';
import { useReducedMotion } from 'react-native-reanimated';
import { Carousel } from '@/components/panel/carousel';
import { HeroSlide } from './hero-slide';

/**
 * The swipeable photo layer behind the hero copy (PanelUI Carousel). It advances on its own until the first touch,
 * and not at all when the device asks for reduced motion.
 */
export function FeaturedCarCarousel({
  vehicles,
  width,
  height,
  onSelect,
  onImageError,
  onIndexChange,
}: {
  vehicles: VehicleSummary[];
  width: number;
  height: number;
  onSelect: (vehicle: VehicleSummary) => void;
  onImageError: (url: string) => void;
  onIndexChange?: (index: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <Carousel loop={vehicles.length > 1} autoplay={vehicles.length > 1 && !reducedMotion} autoplayInterval={5500} itemSize={width} onIndexChange={onIndexChange} style={{ width, height }}>
      <Carousel.Content style={{ width, height }}>
        {vehicles.map((v, i) => (
          <Carousel.Item key={v.slug}>
            <HeroSlide vehicle={v} priority={i === 0} onSelect={() => onSelect(v)} onImageError={onImageError} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      {vehicles.length > 1 ? <Carousel.Dots style={{ position: 'absolute', bottom: 18, alignSelf: 'center' }} /> : null}
    </Carousel>
  );
}
