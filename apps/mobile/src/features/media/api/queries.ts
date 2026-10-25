import { useQuery } from '@tanstack/react-query';
import { getApi } from '@/services/api';

export const vehicleImagesKey = (vehicleId: string) => ['staff', 'vehicle-images', vehicleId] as const;

export function useVehicleImages(vehicleId: string) {
  return useQuery({ queryKey: vehicleImagesKey(vehicleId), queryFn: () => getApi().media.listImages(vehicleId) });
}

export function useStaffInventory() {
  return useQuery({ queryKey: ['staff', 'inventory'], queryFn: () => getApi().inventory.list({ pageSize: 50 }) });
}
