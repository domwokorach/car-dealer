import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { getApi } from '@/services/api';

export function useMe() {
  const { signedIn } = useAuth();
  return useQuery({ queryKey: ['me', 'profile'], queryFn: () => getApi().me(), enabled: signedIn });
}

export function useMyReservations() {
  const { signedIn } = useAuth();
  return useQuery({ queryKey: ['me', 'reservations'], queryFn: () => getApi().reservations.mine(), enabled: signedIn });
}

export function useMyTestDrives() {
  const { signedIn } = useAuth();
  return useQuery({ queryKey: ['me', 'test-drives'], queryFn: () => getApi().testDrives.mine(), enabled: signedIn });
}
