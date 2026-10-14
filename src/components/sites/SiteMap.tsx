import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../lib/theme';
import { getBasemapStyle, getFallbackStyle } from '../../lib/basemap';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  lat: number;
  lng: number;
}

export default function SiteMap({ lat, lng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const apiKey = import.meta.env.VITE_LINZ_API_KEY as string | undefined;
  const { theme } = useTheme();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
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
        center: [lng, lat],
        zoom: 15,
        attributionControl: {},
      });
    } catch (e) {
      setError('Map failed to load');
      return;
    }

    new maplibregl.Marker({ color: '#1D4A38' })
      .setLngLat([lng, lat])
      .addTo(map);

    map.on('error', () => {
      map.setStyle(getFallbackStyle());
      new maplibregl.Marker({ color: '#1D4A38' })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, apiKey, theme]);

  return (
    <div className="hq-map-wrap" ref={containerRef}>
      {!apiKey && (
        <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 12, color: 'var(--muted)', zIndex: 1 }}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}
