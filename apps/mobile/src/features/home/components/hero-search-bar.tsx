import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SearchBar } from '@/components/panel/search-bar';
import { spacing } from '@/theme';

/** Compact search under the hero. Submitting opens the Cars tab with the term applied. */
export function HeroSearchBar() {
  const [term, setTerm] = useState('');
  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <SearchBar
        placeholder="Search brand, model or vehicle..."
        value={term}
        onChangeText={setTerm}
        onSubmit={(value) => router.push({ pathname: '/cars', params: { q: value.trim() } })}
        returnKeyType="search"
        accessibilityLabel="Search brand, model or vehicle"
      />
    </View>
  );
}
