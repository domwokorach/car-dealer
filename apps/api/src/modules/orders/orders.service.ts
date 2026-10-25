import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Order, OrderStatus, SessionUser } from '@car-dealer/contracts';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertBranchAccess, scopeBranchFilter } from '../auth/access-policy';
import { OutboxService } from '../notifications/outbox.service';
import { ReservationsRepository } from '../reservations/reservations.repository';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersRepository, toOrder } from './orders.repository';

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: OrdersRepository,
    private readonly reservations: ReservationsRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** Converts an active reservation into an order, carrying over the agreed price snapshot. */
  createFromReservation(user: SessionUser, dto: CreateOrderDto): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const found = await this.reservations.findById(dto.reservationId, tx);
      if (!found) throw new NotFoundException('Reservation not found');
      assertBranchAccess(user, found.branchId);

      await this.prisma.lockStockVehicle(tx, found.stockVehicleId);
      const reservation = await this.reservations.findById(dto.reservationId, tx);
      if (reservation?.status !== 'ACTIVE' || reservation.expiresAt.getTime() <= Date.now()) {
        throw new ConflictException('Reservation is not active');
      }

      const order = await tx.order.create({
        data: {
          stockVehicleId: reservation.stockVehicleId,
          branchId: reservation.branchId,
          profileId: reservation.profileId,
          reservationId: reservation.id,
          // The price agreed at reservation time; never re-read from the vehicle's current asking price.
          agreedPricePence: reservation.pricePence,
        },
      });
      await tx.reservation.update({ where: { id: reservation.id }, data: { status: 'CONVERTED' } });
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: order.branchId,
        entityType: 'order',
        entityId: order.id,
        action: 'order.created',
        changes: { reservationId: reservation.id, agreedPricePence: order.agreedPricePence },
      });
      await this.outbox.enqueue(tx, 'order.created', { orderId: order.id, branchId: order.branchId });
      return toOrder(order);
    });
  }

  async listForStaff(user: SessionUser): Promise<Order[]> {
    return (await this.repo.forBranches(scopeBranchFilter(user))).map(toOrder);
  }

  async mine(user: SessionUser): Promise<Order[]> {
    return (await this.repo.mine(user.id)).map(toOrder);
  }

  updateStatus(user: SessionUser, id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const found = await this.repo.findById(id, tx);
      if (!found) throw new NotFoundException('Order not found');
      // Confirming is a sales task; completing or cancelling a sale needs a branch manager.
      assertBranchAccess(user, found.branchId, dto.status === 'CONFIRMED' ? 'SALES_EXECUTIVE' : 'BRANCH_MANAGER');

      await this.prisma.lockStockVehicle(tx, found.stockVehicleId);
      const order = await this.repo.findById(id, tx);
      if (!order || !TRANSITIONS[order.status].includes(dto.status)) {
        throw new ConflictException(`Cannot move order from ${order?.status} to ${dto.status}`);
      }

      const updated = await tx.order.update({ where: { id }, data: { status: dto.status } });
      if (dto.status === 'COMPLETED') {
        await tx.stockVehicle.update({ where: { id: order.stockVehicleId }, data: { status: 'SOLD' } });
        await tx.listing.updateMany({ where: { stockVehicleId: order.stockVehicleId }, data: { status: 'ARCHIVED' } });
      } else if (dto.status === 'CANCELLED') {
        await tx.stockVehicle.update({ where: { id: order.stockVehicleId }, data: { status: 'AVAILABLE' } });
      }
      await this.audit.record(tx, {
        actorId: user.id,
        branchId: order.branchId,
        entityType: 'order',
        entityId: id,
        action: 'order.status_changed',
        changes: { from: order.status, to: dto.status },
      });
      await this.outbox.enqueue(tx, 'order.status_changed', { orderId: id, status: dto.status });
      return toOrder(updated);
    });
  }
}
