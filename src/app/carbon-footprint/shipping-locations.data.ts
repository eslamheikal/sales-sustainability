export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface DestinationCountry {
  code: string;
  name: string;
  cities: GeoLocation[];
}

// Placeholder until each product's production plant comes from product data.
export const DEFAULT_PRODUCTION_PLANT: GeoLocation = {
  name: 'Aptar Radolfzell, Germany',
  lat: 47.7369,
  lng: 8.9696,
};

// Average road/sea routes are longer than the straight-line (great-circle) distance.
export const ROUTE_DETOUR_FACTOR = 1.2;

export const DESTINATION_COUNTRIES: DestinationCountry[] = [
  {
    code: 'DE',
    name: 'Germany',
    cities: [
      { name: 'Berlin', lat: 52.52, lng: 13.405 },
      { name: 'Hamburg', lat: 53.5511, lng: 9.9937 },
      { name: 'Munich', lat: 48.1351, lng: 11.582 },
      { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    cities: [
      { name: 'Paris', lat: 48.8566, lng: 2.3522 },
      { name: 'Lyon', lat: 45.764, lng: 4.8357 },
      { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    cities: [
      { name: 'Milan', lat: 45.4642, lng: 9.19 },
      { name: 'Rome', lat: 41.9028, lng: 12.4964 },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    cities: [
      { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
      { name: 'Barcelona', lat: 41.3874, lng: 2.1686 },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    cities: [
      { name: 'London', lat: 51.5072, lng: -0.1276 },
      { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
    ],
  },
  {
    code: 'PL',
    name: 'Poland',
    cities: [
      { name: 'Warsaw', lat: 52.2297, lng: 21.0122 },
      { name: 'Kraków', lat: 50.0647, lng: 19.945 },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    cities: [
      { name: 'New York', lat: 40.7128, lng: -74.006 },
      { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
      { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    cities: [
      { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
      { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    cities: [
      { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
      { name: 'Alexandria', lat: 31.2001, lng: 29.9187 },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    cities: [
      { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
      { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
    ],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    cities: [
      { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
      { name: 'Jeddah', lat: 21.4858, lng: 39.1925 },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    cities: [
      { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
      { name: 'New Delhi', lat: 28.6139, lng: 77.209 },
    ],
  },
  {
    code: 'CN',
    name: 'China',
    cities: [
      { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
      { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
    ],
  },
];

export function distanceKm(from: GeoLocation, to: GeoLocation): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}
