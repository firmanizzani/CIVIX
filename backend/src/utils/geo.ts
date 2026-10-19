export const isWithinDKIJakarta = (lat: number, lng: number): boolean => {
  // DKI Jakarta bounds approximately:
  // Lat: -6.3700 to -6.0800 (Kepulauan Seribu up to ~ -5.20, mainland ~ -6.08)
  // Lng: 106.6800 to 106.9700
  return lat >= -6.38 && lat <= -5.2 && lng >= 106.68 && lng <= 106.98;
};
