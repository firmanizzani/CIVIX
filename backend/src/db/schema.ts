import { pgTable, varchar, text, timestamp, boolean, numeric, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

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

export const agencies = pgTable('agencies', {
  id: varchar('id', { length: 40 }).primaryKey().default(sql`'agency_' || lpad(nextval('seq_agency_id')::text, 3, '0')`),
  nama: varchar('nama', { length: 150 }).notNull(),
  deskripsi: text('deskripsi'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 40 }).primaryKey().default(sql`'user_' || lpad(nextval('seq_user_id')::text, 3, '0')`),
  nama: varchar('nama', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  peran: peranUserEnum('peran').notNull().default('warga'),
  agencyId: varchar('agency_id', { length: 40 }).references(() => agencies.id, { onDelete: 'set null' }),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

export const regions = pgTable('regions', {
  id: varchar('id', { length: 40 }).primaryKey().default(sql`'region_' || lpad(nextval('seq_region_id')::text, 3, '0')`),
  nama: varchar('nama', { length: 100 }).notNull().unique(),
  tipe: varchar('tipe', { length: 30 }).notNull().default('kecamatan'),
});

export const reports = pgTable(
  'reports',
  {
    id: varchar('id', { length: 40 }).primaryKey().default(sql`'report_' || lpad(nextval('seq_reports_id')::text, 3, '0')`),
    kodeTiket: varchar('kode_tiket', { length: 20 }).notNull().unique(),
    userId: varchar('user_id', { length: 40 }).references(() => users.id, { onDelete: 'set null' }),
    regionId: varchar('region_id', { length: 40 }).references(() => regions.id, { onDelete: 'set null' }),
    assignedAgencyId: varchar('assigned_agency_id', { length: 40 }).references(() => agencies.id, { onDelete: 'set null' }),
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
  id: varchar('id', { length: 40 }).primaryKey().default(sql`'rphoto_' || lpad(nextval('seq_report_photos_id')::text, 3, '0')`),
  reportId: varchar('report_id', { length: 40 })
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  jenis: jenisFotoEnum('jenis').notNull().default('awal'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

export const reportStatusLogs = pgTable(
  'report_status_logs',
  {
    id: varchar('id', { length: 40 }).primaryKey().default(sql`'rlog_' || lpad(nextval('seq_report_status_logs_id')::text, 3, '0')`),
    reportId: varchar('report_id', { length: 40 })
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    diubahOleh: varchar('diubah_oleh', { length: 40 }).references(() => users.id, { onDelete: 'set null' }),
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
    id: varchar('id', { length: 40 }).primaryKey().default(sql`'comment_' || lpad(nextval('seq_comments_id')::text, 3, '0')`),
    reportId: varchar('report_id', { length: 40 })
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 40 })
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
    id: varchar('id', { length: 40 }).primaryKey().default(sql`'upvote_' || lpad(nextval('seq_upvotes_id')::text, 3, '0')`),
    reportId: varchar('report_id', { length: 40 })
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 40 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    waktu: timestamp('waktu', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reportUserUnique: uniqueIndex('upvotes_report_user_unique').on(table.reportId, table.userId),
  })
);

export const reportAssignments = pgTable(
  'report_assignments',
  {
    id: varchar('id', { length: 40 }).primaryKey().default(sql`'rasgn_' || lpad(nextval('seq_report_assignments_id')::text, 3, '0')`),
    reportId: varchar('report_id', { length: 40 })
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    agencyId: varchar('agency_id', { length: 40 })
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    assignedBy: varchar('assigned_by', { length: 40 }).references(() => users.id, { onDelete: 'set null' }),
    catatan: text('catatan'),
    dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reportIdx: index('idx_assignments_report').on(table.reportId),
    agencyIdx: index('idx_assignments_agency').on(table.agencyId),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  agency: one(agencies, { fields: [users.agencyId], references: [agencies.id] }),
  reports: many(reports),
  statusLogs: many(reportStatusLogs),
  comments: many(comments),
  upvotes: many(upvotes),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  region: one(regions, { fields: [reports.regionId], references: [regions.id] }),
  assignedAgency: one(agencies, { fields: [reports.assignedAgencyId], references: [agencies.id] }),
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
