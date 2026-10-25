import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApi } from '@/services/api';
import { vehicleImagesKey } from './queries';

/** Photos changed: refresh the staff gallery and every public listing that may show the cover. */
function useRefreshAfter(vehicleId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: vehicleImagesKey(vehicleId) });
    void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    void queryClient.invalidateQueries({ queryKey: ['vehicle'] });
  };
}

export function useRemoveImage(vehicleId: string) {
  const refresh = useRefreshAfter(vehicleId);
  return useMutation({ mutationFn: (imageId: string) => getApi().media.remove(vehicleId, imageId), onSuccess: refresh });
}

export function useSetPrimaryImage(vehicleId: string) {
  const refresh = useRefreshAfter(vehicleId);
  return useMutation({ mutationFn: (imageId: string) => getApi().media.setPrimary(vehicleId, imageId), onSuccess: refresh });
}

export function useReorderImages(vehicleId: string) {
  const refresh = useRefreshAfter(vehicleId);
  return useMutation({ mutationFn: (imageIds: string[]) => getApi().media.reorder(vehicleId, imageIds), onSuccess: refresh });
}

export { useRefreshAfter };
