import { useMutation } from '@tanstack/react-query';
import type { EnquiryCreateInput } from '@car-dealer/contracts';
import { getApi } from '@/services/api';

export const useCreateEnquiry = () => useMutation({ mutationFn: (input: EnquiryCreateInput) => getApi().enquiries.create(input) });
