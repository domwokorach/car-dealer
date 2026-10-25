import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Calendar } from '@/components/panel/calendar';
import { Dialog } from '@/components/panel/dialog';
import { Field } from '@/components/panel/field';
import { Steps } from '@/components/panel/steps';
import { Button, Chip, Input, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';
import { availableHours, hourLabel, slotDate, upcomingDays } from '@/utils/slots';
import { useBookTestDrive } from '../api/mutations';

const STEPS = ['Day', 'Time', 'Confirm'] as const;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Picks from real, bookable slots (next 14 days, at least an hour ahead): the Calendar only enables days that have one. */
export function TestDriveForm({ listingId, onDone }: { listingId: string; onDone: () => void }) {
  const days = useMemo(() => upcomingDays(new Date()), []);
  const bookable = useMemo(() => days.map((d) => d.day), [days]);
  const [day, setDay] = useState<Date>();
  const [hour, setHour] = useState<number>();
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const mutation = useBookTestDrive();

  const hours = day ? availableHours(day, new Date()) : [];
  const step = !day ? 0 : hour === undefined ? 1 : 2;
  const when = day && hour !== undefined ? slotDate(day, hour) : undefined;
  const first = bookable[0];
  const last = bookable[bookable.length - 1];

  if (mutation.isSuccess) {
    return (
      <View style={{ gap: spacing.lg }}>
        <Text variant="title">Test drive requested</Text>
        <Text tone="muted">{formatDateTime(mutation.data.scheduledAt)}. The branch will confirm by email.</Text>
        <Button title="Done" onPress={onDone} />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xl }}>
      <Steps value={step}>
        {STEPS.map((title, i) => (
          <Steps.Item key={title} step={i}>
            <Steps.Indicator />
            <Steps.Title>{title}</Steps.Title>
          </Steps.Item>
        ))}
      </Steps>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="muted">Day</Text>
        <Calendar
          mode="single"
          selected={day}
          onSelect={(d) => { setDay(d); setHour(undefined); }}
          {...(first ? { minDate: first } : {})}
          {...(last ? { maxDate: last } : {})}
          disabled={(d) => !bookable.some((b) => sameDay(b, d))}
        />
      </View>

      {day ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label" tone="muted">Time</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {hours.map((h) => (
              <Chip key={h} label={hourLabel(h)} selected={hour === h} onPress={() => setHour(h)} />
            ))}
          </View>
        </View>
      ) : null}

      <Field>
        <Input label="Anything the branch should know? (optional)" value={notes} onChangeText={setNotes} multiline maxLength={1000} />
      </Field>

      {mutation.isError ? (
        <Text tone="danger" variant="caption" accessibilityRole="alert">
          {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
        </Text>
      ) : null}
      <Button title="Review and request" disabled={!when} onPress={() => setConfirming(true)} />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <Dialog.Content>
          <Dialog.Title>Request this test drive?</Dialog.Title>
          <Dialog.Description>{when ? `${formatDateTime(when.toISOString())}. The branch will confirm by email.` : ''}</Dialog.Description>
          <Dialog.Footer>
            <Button title="Back" variant="secondary" onPress={() => setConfirming(false)} />
            <Button
              title="Request test drive"
              loading={mutation.isPending}
              onPress={() => {
                if (!when) return;
                mutation.mutate({ listingId, scheduledAt: when.toISOString(), notes: notes.trim() || null }, { onSettled: () => setConfirming(false) });
              }}
            />
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </View>
  );
}
