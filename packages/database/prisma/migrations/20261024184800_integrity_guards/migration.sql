-- Integrity guards Prisma cannot express in schema.prisma.
-- These are the database-level backstops for the business rules in docs/database.md.

-- Rule 5: two customers can never hold the same vehicle at once.
CREATE UNIQUE INDEX "reservations_one_active_per_vehicle"
  ON "reservations" ("stockVehicleId") WHERE "status" = 'ACTIVE';

-- A vehicle can only have one live (non-cancelled) order.
CREATE UNIQUE INDEX "orders_one_open_per_vehicle"
  ON "orders" ("stockVehicleId") WHERE "status" <> 'CANCELLED';

-- A vehicle can only have one pending transfer.
CREATE UNIQUE INDEX "transfers_one_requested_per_vehicle"
  ON "inventory_transfers" ("stockVehicleId") WHERE "status" = 'REQUESTED';

-- Value sanity.
ALTER TABLE "stock_vehicles"
  ADD CONSTRAINT "stock_vehicles_price_nonneg" CHECK ("askingPricePence" >= 0),
  ADD CONSTRAINT "stock_vehicles_mileage_nonneg" CHECK ("mileage" IS NULL OR "mileage" >= 0);
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_price_nonneg" CHECK ("pricePence" >= 0),
  ADD CONSTRAINT "reservations_expiry_after_creation" CHECK ("expiresAt" > "createdAt");
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_price_nonneg" CHECK ("agreedPricePence" >= 0);
ALTER TABLE "inventory_transfers"
  ADD CONSTRAINT "transfers_distinct_branches" CHECK ("fromBranchId" <> "toBranchId");

-- Rule 6: price snapshots never change after creation.
CREATE FUNCTION "forbid_reservation_price_change"() RETURNS trigger AS $$
BEGIN
  IF NEW."pricePence" IS DISTINCT FROM OLD."pricePence" THEN
    RAISE EXCEPTION 'reservations.pricePence is an immutable snapshot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "forbid_order_price_change"() RETURNS trigger AS $$
BEGIN
  IF NEW."agreedPricePence" IS DISTINCT FROM OLD."agreedPricePence" THEN
    RAISE EXCEPTION 'orders.agreedPricePence is an immutable snapshot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "reservations_price_snapshot" BEFORE UPDATE ON "reservations"
  FOR EACH ROW EXECUTE FUNCTION "forbid_reservation_price_change"();
CREATE TRIGGER "orders_price_snapshot" BEFORE UPDATE ON "orders"
  FOR EACH ROW EXECUTE FUNCTION "forbid_order_price_change"();

-- Rule 8: audit events are append-only.
CREATE FUNCTION "forbid_audit_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_events_append_only" BEFORE UPDATE OR DELETE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION "forbid_audit_mutation"();
