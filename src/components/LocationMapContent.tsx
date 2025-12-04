import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryIcon, getCategoryFromName, getDefaultIcon } from "@/lib/markerIcons";

interface LocationMapContentProps {
  lat: number;
  lng: number;
  address?: string;
}

const LocationMapContent = ({ lat, lng, address }: LocationMapContentProps) => {
  const category = address ? getCategoryFromName(address) : "default";
  const icon = address ? getCategoryIcon(category) : getDefaultIcon();

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
      <style>{`
        .custom-marker-icon {
          background: transparent;
          border: none;
        }
      `}</style>
      <MapContainer
        key={`${lat}-${lng}`}
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{address || "Waste Location"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          </Popup>
          {address && (
            <Tooltip permanent direction="top" offset={[0, -35]}>
              <span className="font-semibold text-xs">{address}</span>
            </Tooltip>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMapContent;
