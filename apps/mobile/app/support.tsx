import { EnquiryCreateSchema } from '@car-dealer/contracts';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, View } from 'react-native';
import { Message } from '@/components/panel/message';
import { Select } from '@/components/panel/select';
import { Support } from '@/components/panel/support';
import { Screen } from '@/components/layout/screen';
import { Button, ErrorState, Input, LoadingState, Text } from '@/components/ui';
import { useBranches } from '@/features/catalogue/api/queries';
import { useCreateEnquiry } from '@/features/enquiries/api/mutations';
import { useAuth } from '@/providers/auth-provider';
import { spacing } from '@/theme';

/** Customer support = a message to a branch (the API's enquiry endpoint). Branch replies arrive by email. */
export default function SupportScreen() {
  const { session } = useAuth();
  const branches = useBranches();
  const mutation = useCreateEnquiry();
  const [branchId, setBranchId] = useState<string>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (branches.isPending) return <LoadingState />;
  if (branches.isError) return <ErrorState error={branches.error} onRetry={() => void branches.refetch()} />;

  const branch = branches.data.find((b) => b.id === branchId) ?? branches.data[0];

  function send() {
    if (!branch) return;
    const parsed = EnquiryCreateSchema.safeParse({ branchId: branch.id, name, email, phone: null, message });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? '_'), i.message])));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        setSent((s) => [...s, parsed.data.message]);
        setMessage('');
      },
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Support>
          <Support.Header title="How can we help?" description="Message your nearest branch, or call or email them directly." />
          {branch?.phone || branch?.email ? (
            <Support.Channels>
              {branch.phone ? <Support.Channel label="Call the branch" detail={branch.phone} onPress={() => void Linking.openURL(`tel:${branch.phone?.replace(/\s+/g, '')}`)} /> : null}
              {branch.email ? <Support.Channel label="Email the branch" detail={branch.email} onPress={() => void Linking.openURL(`mailto:${branch.email}`)} /> : null}
            </Support.Channels>
          ) : null}
        </Support>

        {branches.data.length > 1 ? (
          <Select value={branch?.id} onValueChange={setBranchId} placeholder="Choose a branch">
            {branches.data.map((b) => <Select.Item key={b.id} value={b.id} label={`${b.name}, ${b.city}`} />)}
          </Select>
        ) : null}

        {sent.map((text, i) => (
          <Message key={i} align="end">
            <Message.Content>
              <Message.Bubble>
                <Message.BubbleContent>{text}</Message.BubbleContent>
              </Message.Bubble>
            </Message.Content>
          </Message>
        ))}
        {sent.length > 0 ? <Text variant="caption" tone="muted">Sent to {branch?.name}. They’ll reply to {email} by email.</Text> : null}

        <View style={{ gap: spacing.lg }}>
          <Input label="Name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" />
          {!session ? <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" /> : null}
          <Input label="Message" value={message} onChangeText={setMessage} error={errors.message} multiline />
          {mutation.isError ? (
            <Text tone="danger" variant="caption" accessibilityRole="alert">
              {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong.'}
            </Text>
          ) : null}
          <Button title="Send message" loading={mutation.isPending} onPress={send} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
