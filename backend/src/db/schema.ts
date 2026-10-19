import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, serial, integer, pgEnum, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const peranUserEnum = pgEnum('peran_user', ['warga', 'admin', 'instansi']);
export const kategoriLaporanEnum = pgEnum('kategori_laporan', [
  'jalan_rusak',
  'drainase',
  'sampah',
  'penerangan',
  'fasilitas_umum',
  'lainnya',
]);
export const statusLaporanEnum = pgEnum('status_laporan', [
  'diterima',
  'diverifikasi',
  'ditugaskan',
  'dikerjakan',
  'selesai',
  'ditolak',
  'duplikat',
]);
export const jenisFotoEnum = pgEnum('jenis_foto', ['awal', 'bukti_perbaikan']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  peran: peranUserEnum('peran').notNull().default('warga'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  nama: varchar('nama', { length: 100 }).notNull(),
  tipe: varchar('tipe', { length: 30 }).notNull().default('kecamatan'),
});

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kodeTiket: varchar('kode_tiket', { length: 20 }).notNull().unique(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    regionId: integer('region_id').references(() => regions.id, { onDelete: 'set null' }),
    judul: varchar('judul', { length: 150 }).notNull(),
    deskripsi: text('deskripsi').notNull(),
    namaJalan: varchar('nama_jalan', { length: 200 }),
    kategori: kategoriLaporanEnum('kategori').notNull(),
    latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
    longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
    status: statusLaporanEnum('status').notNull().default('diterima'),
    anonim: boolean('anonim').notNull().default(false),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
    selesaiPada: timestamp('selesai_pada', { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index('idx_reports_status').on(table.status),
    kategoriIdx: index('idx_reports_kategori').on(table.kategori),
    regionIdx: index('idx_reports_region').on(table.regionId),
    dibuatIdx: index('idx_reports_dibuat').on(table.dibuatPada),
    koordinatIdx: index('idx_reports_koordinat').on(table.latitude, table.longitude),
  })
);

export const reportPhotos = pgTable('report_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  jenis: jenisFotoEnum('jenis').notNull().default('awal'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

export const reportStatusLogs = pgTable(
  'report_status_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    diubahOleh: uuid('diubah_oleh').references(() => users.id, { onDelete: 'set null' }),
    status: statusLaporanEnum('status').notNull(),
    catatan: text('catatan'),
    waktu: timestamp('waktu', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reportWaktuIdx: index('idx_status_logs_report').on(table.reportId, table.waktu),
  })
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isi: text('isi').notNull(),
    waktu: timestamp('waktu', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reportIdx: index('idx_comments_report').on(table.reportId),
  })
);

export const upvotes = pgTable(
  'upvotes',
  {
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    waktu: timestamp('waktu', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reportId, table.userId] }),
  })
);

export const agencies = pgTable('agencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  nama: varchar('nama', { length: 150 }).notNull(),
  deskripsi: text('deskripsi'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

export const reportAssignments = pgTable(
  'report_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
    catatan: text('catatan'),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reportIdx: index('idx_assignments_report').on(table.reportId),
    agencyIdx: index('idx_assignments_agency').on(table.agencyId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  statusLogs: many(reportStatusLogs),
  comments: many(comments),
  upvotes: many(upvotes),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  region: one(regions, { fields: [reports.regionId], references: [regions.id] }),
  photos: many(reportPhotos),
  statusLogs: many(reportStatusLogs),
  comments: many(comments),
  upvotes: many(upvotes),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  reports: many(reports),
}));

export const reportPhotosRelations = relations(reportPhotos, ({ one }) => ({
  report: one(reports, { fields: [reportPhotos.reportId], references: [reports.id] }),
}));

export const reportStatusLogsRelations = relations(reportStatusLogs, ({ one }) => ({
  report: one(reports, { fields: [reportStatusLogs.reportId], references: [reports.id] }),
  user: one(users, { fields: [reportStatusLogs.diubahOleh], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  report: one(reports, { fields: [comments.reportId], references: [reports.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  report: one(reports, { fields: [upvotes.reportId], references: [reports.id] }),
  user: one(users, { fields: [upvotes.userId], references: [users.id] }),
}));

export const agenciesRelations = relations(agencies, ({ many }) => ({
  assignments: many(reportAssignments),
}));

export const reportAssignmentsRelations = relations(reportAssignments, ({ one }) => ({
  report: one(reports, { fields: [reportAssignments.reportId], references: [reports.id] }),
  agency: one(agencies, { fields: [reportAssignments.agencyId], references: [agencies.id] }),
  assignedByUser: one(users, { fields: [reportAssignments.assignedBy], references: [users.id] }),
}));
