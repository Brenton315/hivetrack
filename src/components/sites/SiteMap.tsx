import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if (!apiKey) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'linz-aerial': {
            type: 'raster',
            tiles: [
              `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=${apiKey}`,
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.linz.govt.nz">LINZ</a> CC BY 4.0',
          },
        },
        layers: [
          {
            id: 'linz-aerial-layer',
            type: 'raster',
            source: 'linz-aerial',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [lng, lat],
      zoom: 15,
      attributionControl: {},
    });

    new maplibregl.Marker({ color: '#f59e0b' })
      .setLngLat([lng, lat])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center">
          <div className="text-2xl mb-1">🗺️</div>
          <p>Map unavailable — set VITE_LINZ_API_KEY</p>
          <p className="text-xs mt-1">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-48 rounded-xl overflow-hidden" />
  );
}
