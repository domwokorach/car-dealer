import { Injectable } from '@nestjs/common';
import type { Branch } from '@car-dealer/contracts';
import type { Branch as BranchRow } from '@car-dealer/database';
import { Db, PrismaService } from '../../database/prisma.service';
import type { CreateBranchDto } from './dto/create-branch.dto';
import type { UpdateBranchDto } from './dto/update-branch.dto';

export function toBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    addressLine1: row.addressLine1,
    city: row.city,
    postcode: row.postcode,
    phone: row.phone,
    email: row.email,
    isActive: row.isActive,
  };
}

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  listAll() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string, db: Db = this.prisma) {
    return db.branch.findUnique({ where: { id } });
  }

  create(db: Db, data: CreateBranchDto) {
    return db.branch.create({ data });
  }

  update(db: Db, id: string, data: UpdateBranchDto) {
    return db.branch.update({ where: { id }, data });
  }
}
