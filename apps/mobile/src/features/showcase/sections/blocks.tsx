import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { Demo } from '../demo';

const BLOCKS = [
  ['boarding-pass', 'Boarding Pass', 'Ticket, countdown and slide-to-check-in. A travel pattern, not a dealership screen.'],
  ['wallet', 'Wallet', 'Card stack, spending chart and swipe-to-act rows. Sample data only.'],
  ['activity', 'Activity', 'Rings, charts and a heatmap. Could inform a dealer dashboard.'],
] as const;

/** The three screen-sized blocks open on their own route so each gets the whole screen. They use their built-in sample data. */
export function Blocks() {
  return (
    <>
      {BLOCKS.map(([name, title, note]) => (
        <Demo key={name} title={title} note={note}>
          <Button title={`Open ${title}`} variant="secondary" onPress={() => router.push({ pathname: '/dev/block/[name]', params: { name } })} />
        </Demo>
      ))}
    </>
  );
}
