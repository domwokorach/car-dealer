import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { SupabaseTokenVerifier, TokenVerifier } from './token-verifier';

@Global()
@Module({
  providers: [AccessService, { provide: TokenVerifier, useClass: SupabaseTokenVerifier }],
  exports: [AccessService, TokenVerifier],
})
export class AuthModule {}
