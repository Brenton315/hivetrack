import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../lib/theme';
import { statusLabel } from '../../lib/strength';
import type { SiteOverview } from '../../lib/hooks';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STATUS_COLORS: Record<string, string> = {
  strong: '#2F7D5B',
  fair: '#E9A820',
  weak: '#B4441C',
};

export default function DashboardMap({ sites }: { sites: SiteOverview[] }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  const basemap = theme === 'dark'
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemap,
      center: [175.4, -41.1],
      zoom: 8,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => setReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const withCoords = sites.filter(s => s.lat != null && s.lng != null);

    for (const site of withCoords) {
      const color = STATUS_COLORS[site.status] ?? STATUS_COLORS.strong;

      const el = document.createElement('div');
      el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.3)`;

      const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
        .setHTML(
          `<div style="font-family:'IBM Plex Sans',sans-serif;font-size:13px;line-height:1.5">` +
          `<strong>${site.name}</strong><br/>` +
          `${site.hiveCount} hive${site.hiveCount !== 1 ? 's' : ''} &middot; ${site.strength}% ${statusLabel(site.status)}<br/>` +
          `<a data-site-id="${site.id}" style="color:#1D4A38;text-decoration:none;font-weight:500;cursor:pointer">View &rarr;</a>` +
          `</div>`
        );

      popup.on('open', () => {
        const link = popup.getElement()?.querySelector<HTMLElement>('[data-site-id]');
        if (link) link.onclick = () => navigate(`/sites/${site.id}`);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.lng!, site.lat!])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    if (withCoords.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const s of withCoords) bounds.extend([s.lng!, s.lat!]);
      map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    } else if (withCoords.length === 1) {
      map.setCenter([withCoords[0].lng!, withCoords[0].lat!]);
      map.setZoom(11);
    }
  }, [sites, ready, navigate]);

  return (
    <div className="hq-card" style={{ overflow: 'hidden' }}>
      <div className="hq-card-head">
        <h2>Your sites</h2>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {sites.filter(s => s.lat && s.lng).length} mapped
        </span>
      </div>
      <div ref={containerRef} className="hq-dashboard-map" />
    </div>
  );
}
