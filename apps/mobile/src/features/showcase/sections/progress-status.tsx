import { ScrollView, View } from 'react-native';
import { Loader } from '@/components/panel/loader';
import { Meter } from '@/components/panel/meter';
import { Spinner } from '@/components/panel/spinner';
import { Timeline } from '@/components/panel/timeline';
import { Demo } from '../demo';

export function ProgressStatus() {
  return (
    <>
      <Demo title="Spinner"><Spinner label="Loading" /></Demo>
      <Demo title="Loader">
        <ScrollView horizontal contentContainerStyle={{ gap: 20 }}>
          {(['pulse-dots', 'bounce-dots', 'bar-cascade', 'morph-ring'] as const).map((v) => <Loader key={v} variant={v} />)}
        </ScrollView>
      </Demo>
      <Demo title="Meter" note="Coloured by where the value falls on the scale.">
        <Meter value={72} minValue={0} maxValue={100} label="Finance affordability" />
      </Demo>
      <Demo title="Timeline">
        <Timeline value={1}>
          {['Reserved', 'Confirmed', 'Collected'].map((t, i) => (
            <Timeline.Item key={t} step={i}>
              <Timeline.Indicator />
              <Timeline.Content><Timeline.Title>{t}</Timeline.Title><Timeline.Description>Step {i + 1}</Timeline.Description></Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Demo>
      <View />
    </>
  );
}
