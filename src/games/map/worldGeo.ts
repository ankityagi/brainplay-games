import { geoNaturalEarth1, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
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
