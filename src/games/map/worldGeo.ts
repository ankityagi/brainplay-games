import { geoArea, geoCentroid, geoDistance, geoNaturalEarth1, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { feature } from 'topojson-client';
import topology from 'world-atlas/countries-110m.json';

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

interface CountryProps {
  name: string;
}

interface TopologyObjects {
  type: 'Topology';
  objects: { countries: unknown };
  arcs: number[][][];
}

const worldTopology = topology as TopologyObjects;
const geo = feature(
  worldTopology as never,
  worldTopology.objects.countries as never,
) as unknown as FeatureCollection<Geometry, CountryProps>;

const projection = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], geo);
const pathGenerator = geoPath(projection);

export interface WorldFeature {
  id: string;
  d: string;
}

export const WORLD_FEATURES: WorldFeature[] = geo.features
  .map((f) => ({ id: String(f.id), d: pathGenerator(f) ?? '' }))
  .filter((f): f is WorldFeature => f.d.length > 0);

const EARTH_RADIUS_KM = 6371;

/**
 * A country's overall geoCentroid can be dragged far from its "real" location by a
 * small but distant overseas territory sharing the same id (e.g. France + French
 * Guiana). Use the centroid of the single largest polygon instead - a much better
 * proxy for "where this country actually is" for distance-based guess feedback.
 */
function mainLandmassCentroid(geometry: Geometry): [number, number] {
  if (geometry.type !== 'MultiPolygon') {
    return geoCentroid({ type: 'Feature', properties: null, geometry });
  }
  const multi = geometry as MultiPolygon;
  let largest: Polygon | null = null;
  let largestArea = -Infinity;
  for (const coordinates of multi.coordinates) {
    const polygon: Polygon = { type: 'Polygon', coordinates };
    const area = geoArea({ type: 'Feature', properties: null, geometry: polygon });
    if (area > largestArea) {
      largestArea = area;
      largest = polygon;
    }
  }
  return geoCentroid({ type: 'Feature', properties: null, geometry: largest ?? geometry });
}

/** [longitude, latitude] centroid for every country, keyed by id. */
export const WORLD_CENTROIDS: Record<string, [number, number]> = Object.fromEntries(
  geo.features.map((f) => [String(f.id), mainLandmassCentroid(f.geometry)]),
);

/** Great-circle distance in km between two countries' centroids. */
export function distanceBetweenCountriesKm(idA: string, idB: string): number {
  const a = WORLD_CENTROIDS[idA];
  const b = WORLD_CENTROIDS[idB];
  if (!a || !b) return 0;
  return geoDistance(a, b) * EARTH_RADIUS_KM;
}
