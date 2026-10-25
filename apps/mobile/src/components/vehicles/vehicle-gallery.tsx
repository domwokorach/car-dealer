import type { VehicleImage } from '@car-dealer/contracts';
import { Image } from 'expo-image';
import { View, useWindowDimensions } from 'react-native';
import { Carousel } from '@/components/panel/carousel';
import { Text } from '@/components/ui';

/** Swipeable full-width photo gallery (PanelUI Carousel). */
export function VehicleGallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const { width } = useWindowDimensions();
  const height = (width * 10) / 16;

  if (images.length === 0) {
    return (
      <View accessibilityLabel={`No photos yet for ${title}`} className="items-center justify-center bg-surface" style={{ width, height }}>
        <Text variant="label" tone="muted">
          Photos coming soon
        </Text>
      </View>
    );
  }
  return (
    <Carousel>
      <Carousel.Content style={{ height }}>
        {images.map((img) => (
          <Carousel.Item key={img.id}>
            <Image source={{ uri: img.url }} accessibilityLabel={img.altText ?? title} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      {images.length > 1 ? <Carousel.Controls /> : null}
    </Carousel>
  );
}
