import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Cleaner {
  id: string;
  full_name: string;
  location_lat: number;
  location_lng: number;
  location_address?: string | null;
  assignedCount: number;
}

interface CleanersOverviewMapProps {
  cleaners: Cleaner[];
}

// Create custom colored icon
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
      "></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Get marker color based on assigned reports count
const getMarkerColor = (assignedCount: number): string => {
  if (assignedCount === 0) return '#22c55e'; // green - available
  if (assignedCount <= 2) return '#eab308'; // yellow - busy
  if (assignedCount <= 4) return '#f97316'; // orange - very busy
  return '#ef4444'; // red - overloaded
};

// Get status label
const getStatusLabel = (assignedCount: number): string => {
  if (assignedCount === 0) return 'Available';
  if (assignedCount <= 2) return 'Busy';
  if (assignedCount <= 4) return 'Very Busy';
  return 'Overloaded';
};

export const CleanersOverviewMap = ({ cleaners }: CleanersOverviewMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Initialize map if not already created
    if (!mapRef.current) {
      // Default center (adjust based on your region)
      const defaultLat = 6.4541;
      const defaultLng = 3.3947;

      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
    }

    // Add markers for cleaners with locations
    if (cleaners.length > 0) {
      const bounds: L.LatLngBoundsExpression = [];

      cleaners.forEach((cleaner) => {
        const color = getMarkerColor(cleaner.assignedCount);
        const icon = createColoredIcon(color);
        const status = getStatusLabel(cleaner.assignedCount);

        const marker = L.marker([cleaner.location_lat, cleaner.location_lng], {
          icon,
        }).addTo(mapRef.current!);

        // Add popup with cleaner info
        marker.bindPopup(`
          <div class="p-2">
            <p class="font-semibold text-sm">${cleaner.full_name}</p>
            <p class="text-xs text-gray-600 mt-1">
              Status: <span class="font-medium" style="color: ${color}">${status}</span>
            </p>
            <p class="text-xs text-gray-600">
              Assigned Reports: ${cleaner.assignedCount}
            </p>
            ${cleaner.location_address ? `
              <p class="text-xs text-gray-500 mt-1">${cleaner.location_address}</p>
            ` : ''}
            <p class="text-xs text-gray-400 mt-1">
              ${cleaner.location_lat.toFixed(6)}, ${cleaner.location_lng.toFixed(6)}
            </p>
          </div>
        `);

        markersRef.current.push(marker);
        bounds.push([cleaner.location_lat, cleaner.location_lng]);
      });

      // Fit map to show all markers
      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
      // Cleanup markers when component unmounts
      markersRef.current.forEach(marker => marker.remove());
    };
  }, [cleaners]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#22c55e] border-2 border-white shadow" />
          <span className="text-sm">Available (0 reports)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#eab308] border-2 border-white shadow" />
          <span className="text-sm">Busy (1-2 reports)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#f97316] border-2 border-white shadow" />
          <span className="text-sm">Very Busy (3-4 reports)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#ef4444] border-2 border-white shadow" />
          <span className="text-sm">Overloaded (5+ reports)</span>
        </div>
      </div>

      {/* Map */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[600px] rounded-lg border border-border overflow-hidden"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#22c55e]/10 rounded-lg border border-[#22c55e]/20">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-[#22c55e]">
            {cleaners.filter(c => c.assignedCount === 0).length}
          </p>
        </div>
        <div className="p-4 bg-[#eab308]/10 rounded-lg border border-[#eab308]/20">
          <p className="text-sm text-muted-foreground">Busy</p>
          <p className="text-2xl font-bold text-[#eab308]">
            {cleaners.filter(c => c.assignedCount > 0 && c.assignedCount <= 2).length}
          </p>
        </div>
        <div className="p-4 bg-[#f97316]/10 rounded-lg border border-[#f97316]/20">
          <p className="text-sm text-muted-foreground">Very Busy</p>
          <p className="text-2xl font-bold text-[#f97316]">
            {cleaners.filter(c => c.assignedCount > 2 && c.assignedCount <= 4).length}
          </p>
        </div>
        <div className="p-4 bg-[#ef4444]/10 rounded-lg border border-[#ef4444]/20">
          <p className="text-sm text-muted-foreground">Overloaded</p>
          <p className="text-2xl font-bold text-[#ef4444]">
            {cleaners.filter(c => c.assignedCount > 4).length}
          </p>
        </div>
      </div>

      {cleaners.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No cleaners with location data available. Set cleaner locations in the Cleaners tab.
        </div>
      )}
    </div>
  );
};
