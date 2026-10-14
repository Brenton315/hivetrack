import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../lib/theme';
import { getBasemapStyle, getFallbackStyle } from '../../lib/basemap';
import type { Hive } from '../../lib/database.types';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  siteLat: number;
  siteLng: number;
  hives: Hive[];
  onHiveClick?: (hive: Hive) => void;
  onHiveMoved?: (hiveId: string, lat: number, lng: number) => void;
  editMode?: boolean;
}

const HIVE_COLORS = {
  active: '#1D4A38',
  dead: '#8B0000',
  merged: '#666',
  deleted: '#999',
  sold: '#B8860B',
} as const;

export default function SiteMapInteractive({ siteLat, siteLng, hives, onHiveClick, onHiveMoved, editMode = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const apiKey = import.meta.env.VITE_LINZ_API_KEY as string | undefined;
  const { theme } = useTheme();
  const [is3D, setIs3D] = useState(false);
  const [error, setError] = useState('');

  const initMap = useCallback(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markersRef.current.clear();
    setError('');

    const style = apiKey
      ? {
          version: 8 as const,
          sources: {
            'linz-aerial': {
              type: 'raster' as const,
              tiles: [`https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=${apiKey}`],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.linz.govt.nz">LINZ</a> CC BY 4.0',
            },
          },
          layers: [{ id: 'linz-aerial-layer', type: 'raster' as const, source: 'linz-aerial', minzoom: 0, maxzoom: 22 }],
        }
      : getBasemapStyle(theme);

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [siteLng, siteLat],
        zoom: 17,
        pitch: is3D ? 45 : 0,
        attributionControl: {},
      });
    } catch (e) {
      setError('Map failed to load');
      return;
    }

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('error', () => map.setStyle(getFallbackStyle()));

    const siteEl = document.createElement('div');
    siteEl.className = 'hq-site-center-marker';
    siteEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="4 2"/></svg>';
    new maplibregl.Marker({ element: siteEl })
      .setLngLat([siteLng, siteLat])
      .addTo(map);

    const activeHives = hives.filter(h => h.status === 'active');
    for (const hive of activeHives) {
      const lat = hive.hive_lat ?? siteLat + (Math.random() - 0.5) * 0.001;
      const lng = hive.hive_lng ?? siteLng + (Math.random() - 0.5) * 0.001;
      addHiveMarker(map, hive, lat, lng);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [siteLat, siteLng, apiKey, theme, is3D]);

  const addHiveMarker = (map: maplibregl.Map, hive: Hive, lat: number, lng: number) => {
    const el = document.createElement('div');
    el.className = 'hq-hive-marker';
    el.style.background = HIVE_COLORS[hive.status] || HIVE_COLORS.active;
    el.title = hive.name;
    el.innerHTML = `<span class="hq-hive-marker-label">${hive.name}</span>`;

    const marker = new maplibregl.Marker({
      element: el,
      draggable: editMode,
    })
      .setLngLat([lng, lat])
      .addTo(map);

    if (editMode) {
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onHiveMoved?.(hive.id, lngLat.lat, lngLat.lng);
      });
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onHiveClick?.(hive);
    });

    markersRef.current.set(hive.id, marker);
  };

  useEffect(() => {
    const cleanup = initMap();
    return cleanup;
  }, [initMap]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const activeHives = hives.filter(h => h.status === 'active');
    for (const hive of activeHives) {
      const lat = hive.hive_lat ?? siteLat + (Math.random() - 0.5) * 0.001;
      const lng = hive.hive_lng ?? siteLng + (Math.random() - 0.5) * 0.001;
      addHiveMarker(map, hive, lat, lng);
    }
  }, [hives, editMode]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="hq-site-map-interactive" ref={containerRef}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
      <div className="hq-map-controls">
        <button
          type="button"
          className={`hq-map-ctrl-btn ${is3D ? 'active' : ''}`}
          onClick={() => setIs3D(!is3D)}
          title={is3D ? 'Switch to 2D' : 'Switch to 3D'}
        >
          {is3D ? '2D' : '3D'}
        </button>
      </div>
      {!apiKey && (
        <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 12, color: 'var(--muted)', zIndex: 1 }}>
          {siteLat.toFixed(4)}, {siteLng.toFixed(4)}
        </div>
      )}
    </div>
  );
}
