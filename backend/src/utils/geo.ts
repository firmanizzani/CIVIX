import jakartaBoundary from './jakarta-boundary.json' with { type: 'json' };

type Ring = number[][];

// A boundary point counts as inside. Use the same test for any holes in a polygon.
function ringContains(ring: Ring, latitude: number, longitude: number) {
  let inside = false;
  for (let index = 1; index < ring.length; index++) {
    const [x1, y1] = ring[index - 1];
    const [x2, y2] = ring[index];
    const cross = (longitude - x1) * (y2 - y1) - (latitude - y1) * (x2 - x1);
    if (Math.abs(cross) < 1e-14 && longitude >= Math.min(x1, x2) && longitude <= Math.max(x1, x2) &&
        latitude >= Math.min(y1, y2) && latitude <= Math.max(y1, y2)) return true;
    if ((y1 > latitude) !== (y2 > latitude) &&
        longitude < x1 + (x2 - x1) * (latitude - y1) / (y2 - y1)) inside = !inside;
  }
  return inside;
}

type Polygon = Ring[];
type BoundaryFeature = {
  properties: { region: string };
  geometry: { type: 'Polygon'; coordinates: Polygon } | { type: 'MultiPolygon'; coordinates: Polygon[] };
};

const features = jakartaBoundary.features as BoundaryFeature[];

export function jakartaRegionsAt(latitude: number, longitude: number): string[] {
  return features.filter(({ geometry }) => {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.some(([outer, ...holes]) =>
      ringContains(outer, latitude, longitude) && !holes.some(hole => ringContains(hole, latitude, longitude)));
  }).map(feature => feature.properties.region);
}

const radians = (degrees: number) => degrees * Math.PI / 180;
export const EARTH_RADIUS_METERS = 6_371_000;

export function distanceMeters(latitude: number, longitude: number, otherLat: number, otherLng: number) {
  const a = Math.sin(radians(otherLat - latitude) / 2) ** 2 +
    Math.cos(radians(latitude)) * Math.cos(radians(otherLat)) * Math.sin(radians(otherLng - longitude) / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, a)));
}
