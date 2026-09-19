import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (Leaflet + Vite issue)
const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:rgba(22,59,46,0.18);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#163B2E;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const STREET = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

const SATELLITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
};

const SATELLITE_LABELS = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Labels &copy; Esri',
};

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function LocationMap({
  latitude,
  longitude,
  radius = 50,
  onPick,
  height = 380,
  zoom = 17,
}) {
  const [layer, setLayer] = useState('street');
  const lat = latitude === '' || latitude == null ? null : Number(latitude);
  const lng = longitude === '' || longitude == null ? null : Number(longitude);
  const hasPoint = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const center = useMemo(
    () => (hasPoint ? [lat, lng] : [-6.2, 106.816666]),
    [hasPoint, lat, lng]
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border-subtle"
      style={{ height, zIndex: 0 }}
    >
      {/* Toggle layer */}
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-full border border-border-subtle bg-surface-card/95 shadow-md backdrop-blur">
        <button
          type="button"
          onClick={() => setLayer('street')}
          className={`cursor-pointer px-3 py-1.5 text-xs font-semibold transition ${
            layer === 'street'
              ? 'bg-brand-900 text-text-inverse'
              : 'text-text-muted hover:bg-brand-100 hover:text-brand-900'
          }`}
        >
          Peta
        </button>
        <button
          type="button"
          onClick={() => setLayer('satellite')}
          className={`cursor-pointer px-3 py-1.5 text-xs font-semibold transition ${
            layer === 'satellite'
              ? 'bg-brand-900 text-text-inverse'
              : 'text-text-muted hover:bg-brand-100 hover:text-brand-900'
          }`}
        >
          Satelit
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={hasPoint ? zoom : 11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        {layer === 'street' ? (
          <TileLayer key="street" url={STREET.url} attribution={STREET.attribution} />
        ) : (
          <>
            <TileLayer key="sat" url={SATELLITE.url} attribution={SATELLITE.attribution} />
            <TileLayer key="sat-label" url={SATELLITE_LABELS.url} attribution={SATELLITE_LABELS.attribution} />
          </>
        )}

        <ClickHandler onPick={(lt, lg) => onPick?.(lt, lg)} />
        {hasPoint && <Recenter lat={lat} lng={lng} zoom={zoom} />}
        {hasPoint && <Marker position={[lat, lng]} icon={markerIcon} />}
        {hasPoint && (
          <Circle
            center={[lat, lng]}
            radius={Number(radius) || 0}
            pathOptions={{
              color: '#163B2E',
              fillColor: '#52B788',
              fillOpacity: 0.25,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
