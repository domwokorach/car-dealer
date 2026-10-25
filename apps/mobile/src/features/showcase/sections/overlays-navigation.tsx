import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/panel/bottom-sheet';
import { Dialog } from '@/components/panel/dialog';
import { Drawer } from '@/components/panel/drawer';
import { Feedback } from '@/components/panel/feedback';
import { Steps } from '@/components/panel/steps';
import { Tabs } from '@/components/panel/tabs';
import { ThemeSelector } from '@/components/panel/theme-selector';
import { Button, Text } from '@/components/ui';
import { Demo } from '../demo';

export function OverlaysNavigation() {
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [note, setNote] = useState('');
  const [step, setStep] = useState(0);
  return (
    <>
      <Demo title="BottomSheet">
        <Button title="Open sheet" variant="secondary" onPress={() => setSheet(true)} />
        <BottomSheet open={sheet} onOpenChange={setSheet}>
          <BottomSheet.Content>
            <BottomSheet.Header><Text variant="title">Sheet</Text></BottomSheet.Header>
            <BottomSheet.Body><Text tone="muted">Drag the grabber to resize or dismiss.</Text></BottomSheet.Body>
            <BottomSheet.Footer><Button title="Close" onPress={() => setSheet(false)} /></BottomSheet.Footer>
          </BottomSheet.Content>
        </BottomSheet>
      </Demo>
      <Demo title="Dialog">
        <Button title="Open dialog" variant="secondary" onPress={() => setDialog(true)} />
        <Dialog open={dialog} onOpenChange={setDialog}>
          <Dialog.Content>
            <Dialog.Title>Are you sure?</Dialog.Title>
            <Dialog.Description>Dialogs render through the single PanelUIProvider portal host.</Dialog.Description>
            <Dialog.Footer><Button title="Cancel" variant="secondary" onPress={() => setDialog(false)} /><Button title="Confirm" onPress={() => setDialog(false)} /></Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </Demo>
      <Demo title="Drawer">
        <Drawer>
          <Drawer.Trigger><Button title="Open drawer" variant="secondary" /></Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header title="Menu" description="Slides in from an edge" />
            <Drawer.Body><Text>Showroom</Text><Text>Saved cars</Text></Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </Demo>
      <Demo title="Feedback">
        <Button title="Give feedback" variant="secondary" onPress={() => setFeedback(true)} />
        <Feedback open={feedback} onOpenChange={setFeedback}>
          <Feedback.Content>
            <Feedback.Panel>
              <Feedback.Title>What should we improve?</Feedback.Title>
              <Feedback.Close />
              <Feedback.Field value={note} onChangeText={setNote} />
            </Feedback.Panel>
            <Feedback.Footer><Feedback.Cancel /><Feedback.Submit onPress={() => { setNote(''); setFeedback(false); }} /></Feedback.Footer>
          </Feedback.Content>
        </Feedback>
      </Demo>
      <Demo title="Tabs">
        <Tabs defaultValue="a">
          <Tabs.List><Tabs.Trigger value="a">One</Tabs.Trigger><Tabs.Trigger value="b">Two</Tabs.Trigger></Tabs.List>
          <Tabs.Content value="a"><Text tone="muted">First panel</Text></Tabs.Content>
          <Tabs.Content value="b"><Text tone="muted">Second panel</Text></Tabs.Content>
        </Tabs>
      </Demo>
      <Demo title="Steps">
        <Steps value={step} onValueChange={setStep}>
          {['Details', 'Review', 'Done'].map((t, i) => (
            <Steps.Item key={t} step={i}><Steps.Indicator /><Steps.Title>{t}</Steps.Title></Steps.Item>
          ))}
        </Steps>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Back" variant="secondary" disabled={step === 0} onPress={() => setStep((s) => s - 1)} />
          <Button title="Next" disabled={step === 2} onPress={() => setStep((s) => s + 1)} />
        </View>
      </Demo>
      <Demo title="ThemeSelector" note="Light, dark or system. Switches the whole app."><ThemeSelector label="Theme" /></Demo>
    </>
  );
}
