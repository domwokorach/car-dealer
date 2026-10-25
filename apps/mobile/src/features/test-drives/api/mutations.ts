import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TestDriveCreateInput } from '@car-dealer/contracts';
import { getApi } from '@/services/api';

export function useBookTestDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TestDriveCreateInput) => getApi().testDrives.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'test-drives'] }),
  });
}
