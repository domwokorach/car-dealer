import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/layout/screen';
import { EnquiryForm } from '@/features/enquiries/components/enquiry-form';
import { useAuth } from '@/providers/auth-provider';

/** `vehicleId` is the listing id (what the API's enquiry/test-drive/reservation endpoints take). */
export default function EnquiryScreen() {
  const { vehicleId, title } = useLocalSearchParams<{ vehicleId: string; title?: string }>();
  const { session } = useAuth();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <EnquiryForm listingId={vehicleId} title={title} defaultEmail={session?.user.email} onDone={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
