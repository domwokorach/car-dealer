import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@car-dealer/database';
import type { SessionUser } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import type { VerifiedToken } from './token-verifier';

const WITH_MEMBERSHIPS = {
  memberships: { where: { isActive: true, branch: { isActive: true } }, select: { branchId: true, role: true } },
} satisfies Prisma.ProfileInclude;

/** Builds the authoritative SessionUser from the database. */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveSession(token: VerifiedToken): Promise<SessionUser> {
    let profile = await this.prisma.profile.findUnique({ where: { id: token.userId }, include: WITH_MEMBERSHIPS });

    if (!profile) {
      // First sign-in: provision a CUSTOMER profile. Privileged roles are only ever granted server-side.
      try {
        profile = await this.prisma.profile.create({
          data: { id: token.userId, email: token.email },
          include: WITH_MEMBERSHIPS,
        });
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') throw e;
        // Lost a creation race, or the email belongs to a stale profile: re-read, else retry without email.
        profile =
          (await this.prisma.profile.findUnique({ where: { id: token.userId }, include: WITH_MEMBERSHIPS })) ??
          (await this.prisma.profile.create({ data: { id: token.userId }, include: WITH_MEMBERSHIPS }));
      }
    }

    if (!profile.isActive) throw new ForbiddenException('Account disabled');

    const global = profile.role === 'HEAD_OFFICE_ADMIN' || profile.role === 'SUPER_ADMIN';
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      branchAccess: global ? 'all' : profile.memberships.map((m) => ({ branchId: m.branchId, role: m.role })),
    };
  }
}
