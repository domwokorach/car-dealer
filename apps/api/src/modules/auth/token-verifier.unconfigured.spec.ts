import { loadEnv } from '../../config/env';
import { SupabaseTokenVerifier } from './token-verifier';

describe('SupabaseTokenVerifier without Supabase configured (development only)', () => {
  const verifier = new SupabaseTokenVerifier(loadEnv({ DATABASE_URL: 'postgresql://localhost/x' }));

  it('rejects every token: there is no bypass', async () => {
    await expect(verifier.verify('anything')).rejects.toThrow('Authentication is not configured on this server');
    await expect(verifier.verify('eyJhbGciOiJub25lIn0.e30.')).rejects.toThrow('not configured');
  });
});
