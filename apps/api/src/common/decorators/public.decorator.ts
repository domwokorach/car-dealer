import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
export const IS_OPTIONAL_AUTH = 'isOptionalAuth';

/** No authentication required. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
/** Anonymous allowed, but a supplied token is verified and attached. */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH, true);
