import { EnquiryCreateSchema } from '@car-dealer/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { useCreateEnquiry } from '../api/mutations';

export function EnquiryForm({ listingId, title, defaultEmail, onDone }: { listingId: string; title?: string | undefined; defaultEmail?: string | undefined; onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(title ? `Hello, I’m interested in the ${title}.` : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useCreateEnquiry();

  function submit() {
    // Same Zod contract the API enforces, so errors appear before the round trip.
    const parsed = EnquiryCreateSchema.safeParse({ listingId, name, email, phone: phone.trim() || null, message });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? '_'), i.message])));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  if (mutation.isSuccess) {
    return (
      <View style={{ gap: spacing.lg }}>
        <Text variant="title">Enquiry sent</Text>
        <Text tone="muted">The branch has your message and will reply by email.</Text>
        <Button title="Done" onPress={onDone} />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.lg }}>
      <Input label="Name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" />
      <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Input label="Phone (optional)" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" />
      <Input label="Message" value={message} onChangeText={setMessage} error={errors.message} multiline />
      {mutation.isError ? (
        <Text tone="danger" variant="caption" accessibilityRole="alert">
          {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
        </Text>
      ) : null}
      <Button title="Send enquiry" loading={mutation.isPending} onPress={submit} />
    </View>
  );
}
