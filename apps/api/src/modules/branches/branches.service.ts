import { Injectable, NotFoundException } from '@nestjs/common';
import type { Branch, SessionUser } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { isAdmin } from '../auth/access-policy';
import { BranchesRepository, toBranch } from './branches.repository';
import type { CreateBranchDto } from './dto/create-branch.dto';
import type { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: BranchesRepository,
    private readonly audit: AuditService,
  ) {}

  /** Public list shows active branches only; head office also sees inactive ones. */
  async list(user?: SessionUser): Promise<Branch[]> {
    const rows = user && isAdmin(user) ? await this.repo.listAll() : await this.repo.listActive();
    return rows.map(toBranch);
  }

  create(actor: SessionUser, dto: CreateBranchDto): Promise<Branch> {
    return this.prisma.$transaction(async (tx) => {
      const row = await this.repo.create(tx, dto);
      await this.audit.record(tx, {
        actorId: actor.id,
        branchId: row.id,
        entityType: 'branch',
        entityId: row.id,
        action: 'branch.created',
        changes: { code: row.code, name: row.name },
      });
      return toBranch(row);
    });
  }

  update(actor: SessionUser, id: string, dto: UpdateBranchDto): Promise<Branch> {
    return this.prisma.$transaction(async (tx) => {
      if (!(await this.repo.findById(id, tx))) throw new NotFoundException('Branch not found');
      const row = await this.repo.update(tx, id, dto);
      await this.audit.record(tx, {
        actorId: actor.id,
        branchId: id,
        entityType: 'branch',
        entityId: id,
        action: 'branch.updated',
        changes: { ...dto },
      });
      return toBranch(row);
    });
  }
}
