import 'server-only';
import { getApi, safely } from '@/lib/api';

export const getSavedListings = () => safely(() => getApi().savedListings.list());
