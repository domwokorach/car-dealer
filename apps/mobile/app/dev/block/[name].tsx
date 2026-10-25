import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityBlock } from '@/components/panel/blocks/activity';
import { BoardingPassBlock } from '@/components/panel/blocks/boarding-pass';
import { WalletBlock } from '@/components/panel/blocks/wallet';

const BLOCKS = { 'boarding-pass': BoardingPassBlock, wallet: WalletBlock, activity: ActivityBlock } as const;

/** Development-only: renders one of PanelUI's complete screen blocks, full screen, with its built-in sample data. */
export default function BlockScreen() {
  const { name } = useLocalSearchParams<{ name: keyof typeof BLOCKS }>();
  if (!__DEV__ || !(name in BLOCKS)) return <Redirect href="/" />;
  const Block = BLOCKS[name];
  return <Block onBack={() => router.back()} />;
}
