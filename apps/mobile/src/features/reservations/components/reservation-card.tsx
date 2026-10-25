import type { Reservation } from '@car-dealer/contracts';
import { formatPence } from '@car-dealer/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Alert } from '@/components/panel/alert';
import { Card } from '@/components/panel/card';
import { Countdown } from '@/components/panel/countdown';
import { Dialog } from '@/components/panel/dialog';
import { Timeline } from '@/components/panel/timeline';
import { Badge, Button } from '@/components/ui';
import { useBranches } from '@/features/catalogue/api/queries';
import { spacing } from '@/theme';
import { formatDateTime, humanise } from '@/utils/format';

/** Warn when this little time is left on a hold (seconds). */
const URGENT_SECONDS = 2 * 60 * 60;

const statusTone = (s: Reservation['status']) => (s === 'ACTIVE' ? 'success' : s === 'EXPIRED' || s === 'CANCELLED' ? 'warning' : 'neutral');

/**
 * One reservation. The Countdown only *displays* the server's `expiresAt`; when it reaches zero we ask the server
 * again (refetch). Status, expiry and release are decided server-side, never by this clock.
 */
export function ReservationCard({ reservation: r }: { reservation: Reservation }) {
  const queryClient = useQueryClient();
  const branches = useBranches();
  const [contactOpen, setContactOpen] = useState(false);
  const branch = branches.data?.find((b) => b.id === r.branchId);
  // Seeded once; the Countdown's onTick keeps it current. It only drives presentation (the urgent banner).
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.floor((new Date(r.expiresAt).getTime() - Date.now()) / 1000)));
  const live = r.status === 'ACTIVE' && secondsLeft > 0;
  const refetch = () => void queryClient.invalidateQueries({ queryKey: ['me', 'reservations'] });

  return (
    <Card>
      <Card.Header>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Card.Title>{formatPence(r.pricePence)}</Card.Title>
          <Badge label={humanise(r.status)} tone={statusTone(r.status)} />
        </View>
        <Card.Description>{branch ? `${branch.name}, ${branch.city}` : 'Price locked at reservation'}</Card.Description>
      </Card.Header>
      <Card.Content>
        <View style={{ gap: spacing.lg }}>
          {live ? (
            <>
              <Countdown to={new Date(r.expiresAt)} urgentBelow={URGENT_SECONDS} onTick={setSecondsLeft} onComplete={refetch} />
              {secondsLeft < URGENT_SECONDS ? (
                <Alert variant="warning">
                  <Alert.Content>
                    <Alert.Title>Your hold ends soon</Alert.Title>
                    <Alert.Description>Contact the branch to arrange collection before {formatDateTime(r.expiresAt)}.</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
            </>
          ) : null}
          <Timeline value={r.status === 'ACTIVE' ? 1 : 2}>
            <Timeline.Item step={0}>
              <Timeline.Indicator />
              <Timeline.Content>
                <Timeline.Title>Reserved</Timeline.Title>
                <Timeline.Description>{formatDateTime(r.createdAt)}</Timeline.Description>
              </Timeline.Content>
            </Timeline.Item>
            <Timeline.Item step={1}>
              <Timeline.Indicator />
              <Timeline.Content>
                <Timeline.Title>{r.status === 'ACTIVE' ? 'Held until' : 'Hold ended'}</Timeline.Title>
                <Timeline.Description>{formatDateTime(r.expiresAt)}</Timeline.Description>
              </Timeline.Content>
            </Timeline.Item>
            {r.status !== 'ACTIVE' ? (
              <Timeline.Item step={2}>
                <Timeline.Indicator />
                <Timeline.Content>
                  <Timeline.Title>{humanise(r.status)}</Timeline.Title>
                </Timeline.Content>
              </Timeline.Item>
            ) : null}
          </Timeline>
        </View>
      </Card.Content>
      <Card.Footer>
        <Button title="Contact branch" variant="secondary" onPress={() => setContactOpen(true)} />
      </Card.Footer>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <Dialog.Content>
          <Dialog.Title>{branch?.name ?? 'Your branch'}</Dialog.Title>
          <Dialog.Description>
            {branch ? `${branch.addressLine1}, ${branch.city} ${branch.postcode}. Reservations are managed by the branch.` : 'Reservations are managed by the branch.'}
          </Dialog.Description>
          <Dialog.Footer>
            {branch?.phone ? <Button title="Call" onPress={() => void Linking.openURL(`tel:${branch.phone?.replace(/\s+/g, '')}`)} /> : null}
            {branch?.email ? <Button title="Email" variant="secondary" onPress={() => void Linking.openURL(`mailto:${branch.email}`)} /> : null}
            <Button title="Close" variant="ghost" onPress={() => setContactOpen(false)} />
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </Card>
  );
}
