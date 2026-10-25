import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ImageUploadTarget, SessionUser, VehicleImage } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertBranchAccess } from '../auth/access-policy';
import type { ConfirmUploadDto } from './dto/confirm-upload.dto';
import type { RequestUploadDto } from './dto/request-upload.dto';
import { EXTENSIONS, isValidUpload, sniffImageType } from './image-sniff';
import { StorageGateway } from './storage.gateway';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageGateway,
    private readonly audit: AuditService,
  ) {}

  private async vehicleBranch(stockVehicleId: string): Promise<string> {
    const v = await this.prisma.stockVehicle.findUnique({ where: { id: stockVehicleId }, select: { branchId: true } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v.branchId;
  }

  /** Step 1: authorise, then hand out a single-use signed upload to a SERVER-CHOSEN path. */
  async requestUpload(user: SessionUser, dto: RequestUploadDto): Promise<ImageUploadTarget> {
    assertBranchAccess(user, await this.vehicleBranch(dto.stockVehicleId));
    // The client never chooses the object path or filename (prevents traversal, overwrite and enumeration).
    const storagePath = `vehicles/${dto.stockVehicleId}/${randomUUID()}.${EXTENSIONS[dto.contentType]}`;
    const { uploadUrl, token } = await this.storage.createSignedUpload(storagePath);
    return { uploadUrl, token, storagePath };
  }

  /** Step 2: after upload, verify the stored bytes really are an allowed image before recording it. */
  async confirmUpload(user: SessionUser, dto: ConfirmUploadDto): Promise<VehicleImage> {
    const branchId = await this.vehicleBranch(dto.stockVehicleId);
    assertBranchAccess(user, branchId);
    if (!dto.storagePath.startsWith(`vehicles/${dto.stockVehicleId}/`) || dto.storagePath.includes('..')) {
      throw new BadRequestException('Invalid storage path');
    }

    const bytes = await this.storage.download(dto.storagePath);
    if (!bytes) throw new BadRequestException('Upload not found');
    if (!isValidUpload(bytes) || !dto.storagePath.endsWith(`.${EXTENSIONS[sniffImageType(bytes)!]}`)) {
      await this.storage.remove(dto.storagePath);
      throw new BadRequestException('File is not a valid JPEG, PNG or WebP image under the size limit');
    }

    return this.prisma.$transaction(async (tx) => {
      const position = await tx.vehicleImage.count({ where: { stockVehicleId: dto.stockVehicleId } });
      const row = await tx.vehicleImage.create({
        data: { stockVehicleId: dto.stockVehicleId, storagePath: dto.storagePath, altText: dto.altText, position },
      });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId,
        entityType: 'stock_vehicle',
        entityId: dto.stockVehicleId,
        action: 'media.image_added',
        changes: { imageId: row.id },
      });
      return { id: row.id, url: this.storage.publicUrl(row.storagePath), altText: row.altText, position: row.position };
    });
  }
}
