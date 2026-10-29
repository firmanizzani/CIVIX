import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { platformSettings } from '../../db/schema.js';

export async function readPlatformSettings(): Promise<{ completedMapDays: number }> {
  const [settings] = await db.select({ completedMapDays: platformSettings.completedMapDays }).from(platformSettings).where(eq(platformSettings.id, 'global')).limit(1);
  return settings || { completedMapDays: 7 };
}
