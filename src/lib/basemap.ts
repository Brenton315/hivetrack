import type { StyleSpecification } from 'maplibre-gl';

const CARTO_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
};

export function getBasemapStyle(theme: string): string | StyleSpecification {
  return theme === 'dark' ? CARTO_DARK : CARTO_LIGHT;
}

export function getFallbackStyle(): StyleSpecification {
  return OSM_STYLE;
}
