import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect?: (address: string) => void;
}

export const LocationPicker = ({ lat, lng, onLocationSelect, onAddressSelect }: LocationPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Reverse geocoding function using Nominatim
  const reverseGeocode = async (latitude: number, longitude: number) => {
    if (!onAddressSelect) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        onAddressSelect(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default to a central location if no coordinates provided
    const defaultLat = lat ?? 6.4541;
    const defaultLng = lng ?? 3.3947;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker if coordinates exist
    if (lat && lng) {
      const marker = L.marker([lat, lng], {
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationSelect(position.lat, position.lng);
        reverseGeocode(position.lat, position.lng);
      });
    }

    // Handle map click to place/move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;

      if (markerRef.current) {
        // Move existing marker
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        // Create new marker
        const marker = L.marker([newLat, newLng], {
          draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        // Handle marker drag
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          onLocationSelect(position.lat, position.lng);
          reverseGeocode(position.lat, position.lng);
        });
      }

      onLocationSelect(newLat, newLng);
      reverseGeocode(newLat, newLng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (mapRef.current && lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true,
        }).addTo(mapRef.current);

        markerRef.current = marker;

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          onLocationSelect(position.lat, position.lng);
          reverseGeocode(position.lat, position.lng);
        });
      }
      mapRef.current.setView([lat, lng], 13);
    }
  }, [lat, lng, onLocationSelect, onAddressSelect]);

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[400px] rounded-lg border border-border overflow-hidden z-0"
      />
      <p className="text-xs text-muted-foreground">
        Click on the map to set location, or drag the marker to adjust
      </p>
    </div>
  );
};
