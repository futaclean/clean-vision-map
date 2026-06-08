import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";

export interface SmartBin {
  bin_id: string;
  bin_name: string | null;
  latitude: number;
  longitude: number;
  fill_level: number;
  status: string;
  last_updated: string;
  address?: string;
  is_online?: boolean;
}

export const binColor = (status: string) => {
  switch (status) {
    case "LOW":
      return "#22c55e";
    case "MEDIUM":
      return "#eab308";
    case "HIGH":
      return "#f97316";
    case "FULL":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const binIcon = (status: string, online: boolean) => {
  const color = binColor(status);
  return L.divIcon({
    className: "smart-bin-marker",
    html: `
      <div style="position:relative;">
        <div style="
          background:${color};
          width:30px;height:30px;border-radius:8px;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:12px;
          ${status === "FULL" ? "animation: bin-pulse 1.2s infinite;" : ""}
        ">B</div>
        <span style="
          position:absolute;top:-4px;right:-4px;
          width:10px;height:10px;border-radius:50%;
          background:${online ? "#10b981" : "#9ca3af"};
          border:2px solid white;"></span>
      </div>
      <style>@keyframes bin-pulse {0%,100%{transform:scale(1);}50%{transform:scale(1.15);}}</style>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

interface Props {
  bins: SmartBin[];
  height?: string;
  center?: [number, number];
}

export const SmartBinsMap = ({ bins, height = "500px", center }: Props) => {
  const mapCenter: [number, number] =
    center ?? (bins[0] ? [bins[0].latitude, bins[0].longitude] : [7.3034, 5.132]);

  return (
    <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        // @ts-ignore
        center={mapCenter}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {bins.map((b) => (
          <Marker
            key={b.bin_id}
            // @ts-ignore
            position={[b.latitude, b.longitude]}
            // @ts-ignore
            icon={binIcon(b.status, !!b.is_online)}
          >
            <Popup>
              <div className="space-y-1 text-sm min-w-[200px]">
                <div className="flex items-center justify-between">
                  <strong>{b.bin_name || b.bin_id}</strong>
                  <Badge style={{ background: binColor(b.status), color: "white" }}>
                    {b.status}
                  </Badge>
                </div>
                <div>ID: {b.bin_id}</div>
                <div>Fill: {b.fill_level.toFixed(0)}%</div>
                <div>{b.address || `${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}`}</div>
                <div className="text-muted-foreground text-xs">
                  Updated {new Date(b.last_updated).toLocaleString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};