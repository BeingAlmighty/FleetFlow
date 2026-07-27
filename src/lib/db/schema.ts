import { pgTable, uuid, text, integer, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const vehicleStatusEnum = pgEnum('vehicle_status', ['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'DECOMMISSIONED']);

export const hubs = pgTable('hubs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  numberPlate: text('number_plate').unique().notNull(),
  status: vehicleStatusEnum('status').default('AVAILABLE'),
  batteryLevel: integer('battery_level').default(100),
  hubId: uuid('hub_id').references(() => hubs.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  role: text('role'),
  fullName: text('full_name'),
  phone: text('phone'),
  area: text('area'),
});
