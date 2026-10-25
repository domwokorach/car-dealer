import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { exportJWK, generateKeyPair, SignJWT, type JWK, type KeyLike } from 'jose';
import { loadEnv } from '../../config/env';
import { SupabaseTokenVerifier } from './token-verifier';

const ISSUER = 'https://project.supabase.co/auth/v1';
const USER = '3f1d9c2e-5a4b-4c1d-8e7f-0a1b2c3d4e5f';

let server: Server;
let verifier: SupabaseTokenVerifier;
let signingKey: KeyLike;
let strangerKey: KeyLike;

async function token(opts: { key?: KeyLike; issuer?: string; audience?: string; expires?: string; sub?: string; kid?: string } = {}) {
  return new SignJWT({ email: 'a@example.test', role: 'service_role' })
    .setProtectedHeader({ alg: 'RS256', kid: opts.kid ?? 'test-key' })
    .setSubject(opts.sub ?? USER)
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(opts.expires ?? '5m')
    .sign(opts.key ?? signingKey);
}

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  signingKey = pair.privateKey;
  strangerKey = (await generateKeyPair('RS256')).privateKey;
  const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };

  server = createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  verifier = new SupabaseTokenVerifier(
    loadEnv({
      DATABASE_URL: 'postgresql://localhost/x',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_JWKS_URL: `http://127.0.0.1:${port}/jwks.json`,
      SUPABASE_JWT_ISSUER: ISSUER,
      SUPABASE_SERVICE_ROLE_KEY: 'k',
    }),
  );
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('SupabaseTokenVerifier', () => {
  it('accepts a correctly signed token and returns only the subject and email', async () => {
    await expect(verifier.verify(await token())).resolves.toEqual({ userId: USER, email: 'a@example.test' });
  });

  it('ignores privileged-looking claims (roles come from the database, not the token)', async () => {
    const result = await verifier.verify(await token());
    expect(Object.keys(result).sort()).toEqual(['email', 'userId']);
  });

  it.each([
    ['signed with an unknown key (forged)', () => token({ key: strangerKey })],
    ['from the wrong issuer', () => token({ issuer: 'https://evil.example/auth/v1' })],
    ['for the wrong audience', () => token({ audience: 'anon' })],
    ['expired', () => token({ expires: '-1m' })],
    ['with a non-UUID subject', () => token({ sub: 'admin' })],
    ['with an unknown key id', () => token({ kid: 'other' })],
  ])('rejects a token %s', async (_name, make) => {
    await expect(verifier.verify(await make())).rejects.toThrow('Invalid or expired token');
  });

  it('rejects an unsigned (alg=none) token', async () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const unsigned = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: USER, iss: ISSUER, aud: 'authenticated' })}.`;
    await expect(verifier.verify(unsigned)).rejects.toThrow('Invalid or expired token');
  });

  it('rejects garbage', async () => {
    await expect(verifier.verify('not.a.jwt')).rejects.toThrow('Invalid or expired token');
  });
});
