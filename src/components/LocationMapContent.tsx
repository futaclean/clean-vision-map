import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryIcon, getCategoryFromName, getDefaultIcon, getCategoryInfo } from "@/lib/markerIcons";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LocationMapContentProps {
  lat: number;
  lng: number;
  address?: string;
  showLegend?: boolean;
}

const LocationMapContent = ({ lat, lng, address, showLegend = true }: LocationMapContentProps) => {
  const [legendOpen, setLegendOpen] = useState(false);
  const category = address ? getCategoryFromName(address) : "default";
  const icon = address ? getCategoryIcon(category) : getDefaultIcon();
  const categories = getCategoryInfo();

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border relative">
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

      {showLegend && (
        <div className="absolute bottom-2 right-2 z-[1000]">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden">
            <button
              onClick={() => setLegendOpen(!legendOpen)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium w-full hover:bg-muted/50 transition-colors"
            >
              <span>Legend</span>
              {legendOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>
            {legendOpen && (
              <div className="px-3 pb-2 grid grid-cols-2 gap-x-4 gap-y-1 max-h-32 overflow-y-auto">
                {Object.entries(categories).map(([key, { fill, name }]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: fill }}
                    />
                    <span className="text-[10px] text-muted-foreground truncate">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMapContent;
