import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverviewData } from '../../lib/hooks';
import { useTheme } from '../../lib/theme';
import { statusLabel } from '../../lib/strength';
import Logo from '../layout/Logo';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STATUS_COLORS: Record<string, string> = {
  strong: '#2F7D5B',
  fair: '#E9A820',
  weak: '#B4441C',
};

export default function MapPage() {
  const data = useOverviewData();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const basemap = theme === 'dark'
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  // Initialise map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: basemap,
      center: [175.4, -41.1],
      zoom: 9,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => setMapReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Re-create map when theme changes
  }, [basemap]);

  // Add markers when data + map are ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || data.loading) return;

    // Clear previous markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const sitesWithCoords = data.sites.filter(s => s.lat != null && s.lng != null);

    for (const site of sitesWithCoords) {
      const color = STATUS_COLORS[site.status] ?? STATUS_COLORS.strong;

      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid #fff';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';

      const popup = new maplibregl.Popup({ offset: 14, closeButton: false })
        .setHTML(
          `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:13px;line-height:1.5">` +
          `<strong>${site.name}</strong><br/>` +
          `${site.hiveCount} hive${site.hiveCount !== 1 ? 's' : ''} &middot; ${site.strength}% ${statusLabel(site.status)}<br/>` +
          `<a href="/sites/${site.id}" style="color:#1D4A38;text-decoration:none;font-weight:500">View site &rarr;</a>` +
          `</div>`
        );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.lng!, site.lat!])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Fit bounds if multiple sites
    if (sitesWithCoords.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const s of sitesWithCoords) bounds.extend([s.lng!, s.lat!]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 13 });
    }
  }, [data, mapReady, navigate]);

  if (data.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Map</h1>
          <span className="hq-subtitle">{data.sites.filter(s => s.lat && s.lng).length} sites with coordinates</span>
        </div>
      </header>

      <div
        ref={mapContainer}
        style={{
          flex: 1,
          minHeight: 400,
          maxHeight: 'calc(100vh - 120px)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          margin: '0 0 16px',
        }}
      />
    </div>
  );
}
