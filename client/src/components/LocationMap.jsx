import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { userLocationIcon, gemPinIcon } from '../utils/leafletIcons';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const toLatLng = (point) => {
  if (!point) return null;
  if (Array.isArray(point)) return point;
  return [point.lat, point.lng];
};

export default function LocationMap({
  center,
  zoom = 13,
  height = 280,
  userPosition = null,
  pinPosition = null,
  gems = [],
  onMapClick,
  interactive = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const onClickRef = useRef(onMapClick);

  onClickRef.current = onMapClick;

  const mapCenter =
    toLatLng(center) || toLatLng(userPosition) || [37.7749, -122.4194];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: interactive,
      dragging: interactive,
      doubleClickZoom: interactive,
      zoomControl: interactive,
    }).setView(mapCenter, zoom);

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);

    if (interactive) {
      map.on('click', (e) => {
        onClickRef.current?.(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    mapRef.current?.setView(mapCenter, zoom);
  }, [mapCenter[0], mapCenter[1], zoom]);

  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;

    layer.clearLayers();

    const userLatLng = toLatLng(userPosition);
    if (userLatLng) {
      L.marker(userLatLng, { icon: userLocationIcon }).addTo(layer);
    }

    const pinLatLng = toLatLng(pinPosition);
    if (pinLatLng) {
      L.marker(pinLatLng, { icon: gemPinIcon }).addTo(layer);
    }

    gems.forEach((gem) => {
      if (gem.lat != null && gem.lng != null) {
        L.marker([gem.lat, gem.lng], { icon: gemPinIcon }).addTo(layer);
      }
    });
  }, [userPosition, pinPosition, gems]);

  return (
    <div
      ref={containerRef}
      className="location-map leaflet-map"
      style={{ height }}
    />
  );
}