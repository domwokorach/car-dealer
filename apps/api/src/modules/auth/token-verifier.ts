import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ENV } from '../../config/config.module';
import { authConfigured, type Env } from '../../config/env';

export interface VerifiedToken {
  userId: string;
  email: string | null;
}

/** Abstract so tests can substitute a deterministic verifier without network access. */
export abstract class TokenVerifier {
  abstract verify(token: string): Promise<VerifiedToken>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verifies Supabase access tokens independently of the web apps: signature against the project's JWKS,
 * issuer and audience. Only `sub` (and informational `email`) are read; roles are NEVER taken from claims.
 */
@Injectable()
export class SupabaseTokenVerifier extends TokenVerifier {
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer?: string;

  constructor(@Inject(ENV) env: Env) {
    super();
    if (authConfigured(env)) {
      this.jwks = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL as string));
      this.issuer = env.SUPABASE_JWT_ISSUER;
    }
  }

  async verify(token: string): Promise<VerifiedToken> {
    // Development without Supabase: reject everything. Never accept unverifiable tokens.
    if (!this.jwks || !this.issuer) throw new UnauthorizedException('Authentication is not configured on this server');
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      });
      if (typeof payload.sub !== 'string' || !UUID.test(payload.sub)) throw new Error('bad sub');
      return { userId: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
