import { useState } from 'react';
import { View } from 'react-native';
import { Alert } from '@/components/panel/alert';
import { Badge } from '@/components/panel/badge';
import { Button } from '@/components/panel/button';
import { Swipe } from '@/components/panel/swipe';
import { ToggleButton } from '@/components/panel/toggle-button';
import { Text } from '@/components/ui';
import { Demo } from '../demo';

export function ButtonsInteraction() {
  const [loading, setLoading] = useState(false);
  const [swiped, setSwiped] = useState(0);
  return (
    <>
      <Demo title="Button variants">
        <View style={{ gap: 8 }}>
          {(['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
        </View>
      </Demo>
      <Demo title="Loading" note="Press to simulate a 1.5s request.">
        <Button
          loading={loading}
          onPress={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}
        >
          Reserve
        </Button>
      </Demo>
      <Demo title="Badge">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(['default', 'secondary', 'outline', 'success', 'warning', 'info', 'destructive'] as const).map((v) => (
            <Badge key={v} variant={v}>{v}</Badge>
          ))}
          <Badge shape="count" count={7} />
        </View>
      </Demo>
      <Demo title="ToggleButton">
        <ToggleButton defaultSelected>Favourite</ToggleButton>
      </Demo>
      <Demo title="Alert">
        <Alert variant="info"><Alert.Content><Alert.Title>Heads up</Alert.Title><Alert.Description>Informational message.</Alert.Description></Alert.Content></Alert>
        <Alert variant="destructive"><Alert.Content><Alert.Title>Something failed</Alert.Title></Alert.Content></Alert>
      </Demo>
      <Demo title="Swipe" note={`Swipe the row left. Actions fired: ${swiped}`}>
        <Swipe>
          <Swipe.End>
            <Swipe.Action label="Archive" color="destructive" onPress={() => setSwiped((n) => n + 1)} />
          </Swipe.End>
          <View className="rounded-xl border border-border bg-card p-4"><Text>Swipe me</Text></View>
        </Swipe>
      </Demo>
    </>
  );
}
