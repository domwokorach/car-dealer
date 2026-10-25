import { EnquiryCreateSchema, type EnquiryCreateInput } from '@car-dealer/contracts';

/** Form validation is the shared API contract, so client and server can never disagree. */
export const enquiryFormSchema = EnquiryCreateSchema;
export type EnquiryFormValues = EnquiryCreateInput;
