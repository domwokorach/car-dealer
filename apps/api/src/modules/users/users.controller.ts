import { Controller, Get } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('me')
export class UsersController {
  /** The server-resolved identity: role and branch access come from the database, not the token. */
  @Get()
  me(@CurrentUser() user: SessionUser): SessionUser {
    return user;
  }
}
