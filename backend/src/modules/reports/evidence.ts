import { and, between, eq, inArray, lte, sql } from 'drizzle-orm';
import ExifReader from 'exifreader';
import sharp from 'sharp';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { kategoriLaporanEnum, reportEvidenceChecks, reports } from '../../db/schema.js';
import { distanceMeters, EARTH_RADIUS_METERS } from '../../utils/geo.js';

export const PHOTO_MATCH_RADIUS_METERS = 100;
export const NEARBY_RADIUS_METERS = 50;
export const reportCategory = z.enum(kategoriLaporanEnum.enumValues);

const coordinate = (limit: number) => z.preprocess(value =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
z.number().finite().min(-limit).max(limit));

export const coordinatesSchema = z.object({ latitude: coordinate(90), longitude: coordinate(180) });

export async function findNearbyReports(latitude: number, longitude: number, kategori: z.infer<typeof reportCategory>) {
  const latPadding = NEARBY_RADIUS_METERS / 110_000;
  const lngPadding = latPadding / Math.cos(latitude * Math.PI / 180);
  const distance = sql<number>`2 * ${EARTH_RADIUS_METERS}::float8 * asin(sqrt(least(1,
    power(sin(radians(${reports.latitude}::float8 - ${latitude}::float8) / 2), 2) +
    cos(radians(${latitude}::float8)) * cos(radians(${reports.latitude}::float8)) *
    power(sin(radians(${reports.longitude}::float8 - ${longitude}::float8) / 2), 2)
  )))`;
  const nearby: typeof reportEvidenceChecks.$inferSelect.nearby = await db.select({
    id: reports.id, kodeTiket: reports.kodeTiket, judul: reports.judul, namaJalan: reports.namaJalan,
    distanceMeters: distance,
  }).from(reports).where(and(
    eq(reports.kategori, kategori),
    inArray(reports.status, ['diterima', 'diverifikasi', 'ditugaskan', 'dikerjakan']),
    between(reports.latitude, String(latitude - latPadding), String(latitude + latPadding)),
    between(reports.longitude, String(longitude - lngPadding), String(longitude + lngPadding)),
    lte(distance, NEARBY_RADIUS_METERS),
  )).orderBy(distance, reports.id).limit(5);

  return nearby.map(report => ({ ...report, distanceMeters: Math.round(report.distanceMeters) }));
}

function readPhotoLocation(file: Buffer) {
  try {
    const { gps } = ExifReader.load(file, { expanded: true });
    if (!gps) return null;
    const coordinates = coordinatesSchema.safeParse({ latitude: gps.Latitude, longitude: gps.Longitude });
    return coordinates.success ? coordinates.data : null;
  } catch {
    return null;
  }
}

const photoFormats = {
  'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
} as const;

type PhotoCheck = Omit<typeof reportEvidenceChecks.$inferSelect.photos[number], 'photoId'>;

export async function prepareReportPhoto(file: Express.Multer.File, latitude: number, longitude: number) {
  const image = sharp(file.buffer, { animated: true, limitInputPixels: 50_000_000 });
  const metadata = await image.metadata();
  const format = photoFormats[file.mimetype as keyof typeof photoFormats];
  if (!format || metadata.format !== format) throw new Error('Format foto tidak sesuai.');

  const photoLocation = readPhotoLocation(file.buffer);
  const distance = photoLocation
    ? distanceMeters(latitude, longitude, photoLocation.latitude, photoLocation.longitude)
    : null;
  const status: PhotoCheck['status'] = distance === null ? 'unavailable'
    : distance <= PHOTO_MATCH_RADIUS_METERS ? 'match'
    : 'mismatch';

  // Re-encode without metadata before placing the photo in public storage.
  if ((metadata.pages ?? 1) === 1) image.autoOrient();
  const buffer = await image.toFormat(format).timeout({ seconds: 8 }).toBuffer();
  return {
    buffer,
    mimetype: file.mimetype,
    check: { status, distanceMeters: distance === null ? null : Math.round(distance) } satisfies PhotoCheck,
  };
}
