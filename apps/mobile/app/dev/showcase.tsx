import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Select } from '@/components/panel/select';
import { Blocks } from '@/features/showcase/sections/blocks';
import { ButtonsInteraction } from '@/features/showcase/sections/buttons-interaction';
import { Dates } from '@/features/showcase/sections/dates';
import { Forms } from '@/features/showcase/sections/forms';
import { LayoutTypography } from '@/features/showcase/sections/layout-typography';
import { Maps } from '@/features/showcase/sections/maps';
import { MediaCamera } from '@/features/showcase/sections/media-camera';
import { MessagesSupport } from '@/features/showcase/sections/messages-support';
import { OverlaysNavigation } from '@/features/showcase/sections/overlays-navigation';
import { ProgressStatus } from '@/features/showcase/sections/progress-status';

const SECTIONS = {
  layout: ['Layout and typography', LayoutTypography],
  buttons: ['Buttons and interaction', ButtonsInteraction],
  forms: ['Forms and input controls', Forms],
  dates: ['Dates and scheduling', Dates],
  overlays: ['Overlays and navigation', OverlaysNavigation],
  media: ['Media, uploads and camera', MediaCamera],
  maps: ['Maps and locations', Maps],
  messages: ['Messages and support', MessagesSupport],
  progress: ['Progress and status', ProgressStatus],
  blocks: ['Complete demonstration blocks', Blocks],
} as const;
type SectionKey = keyof typeof SECTIONS;

/** Development-only gallery of every installed PanelUI component. Not reachable in release builds. */
export default function ShowcaseScreen() {
  const [key, setKey] = useState<SectionKey>('layout');
  const insets = useSafeAreaInsets();
  if (!__DEV__) return <Redirect href="/" />;
  const Section = SECTIONS[key][1];

  return (
    <ScrollView className="bg-background" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 + insets.bottom }} keyboardShouldPersistTaps="handled">
      <Select value={key} onValueChange={(v) => setKey(v as SectionKey)}>
        {(Object.keys(SECTIONS) as SectionKey[]).map((k) => <Select.Item key={k} value={k} label={SECTIONS[k][0]} />)}
      </Select>
      <View style={{ gap: 16 }}>
        <Section />
      </View>
    </ScrollView>
  );
}
