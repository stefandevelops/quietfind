"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Spot } from "@/lib/spots";
import { QUIET_LABEL, TYPE_LABEL } from "@/lib/spots";
import "leaflet/dist/leaflet.css";

function Recenter({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function spotIcon(quiet: number, selected: boolean) {
  const size = selected ? 44 : 34;
  const bg =
    quiet >= 4 ? "#1d6b4f" : quiet === 3 ? "#3d6b8a" : "#8a6a2f";
  return L.divIcon({
    className: "quietfind-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:14px;background:${bg};
      color:white;display:flex;align-items:center;justify-content:center;
      font:800 13px/1 Outfit,system-ui,sans-serif;border:3px solid white;
      box-shadow:0 8px 18px rgba(0,0,0,.28);
    ">${quiet}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function SpotMap({
  center,
  spots,
  selectedId,
  userPos,
  onSelect,
}: {
  center: { lat: number; lng: number };
  spots: Spot[];
  selectedId: string | null;
  userPos: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full rounded-2xl"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={selectedId ? 14 : 13} />
      {userPos ? (
        <CircleMarker
          center={[userPos.lat, userPos.lng]}
          radius={10}
          pathOptions={{
            color: "#1d4e89",
            fillColor: "#3b82f6",
            fillOpacity: 0.95,
            weight: 3,
          }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      ) : null}
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={spotIcon(spot.quiet, spot.id === selectedId)}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        >
          <Popup>
            <strong>{spot.name}</strong>
            <br />
            {TYPE_LABEL[spot.type]} · {QUIET_LABEL[spot.quiet as 1 | 2 | 3 | 4 | 5]}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
