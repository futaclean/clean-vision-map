import { lazy, Suspense } from "react";
import MapSkeleton from "./MapSkeleton";

interface LocationMapProps {
  lat: number;
  lng: number;
  address?: string;
}

// Lazy load the actual map component to avoid react-leaflet context issues
const LazyMapContent = lazy(() => import("./LocationMapContent"));

const LocationMap = ({ lat, lng, address }: LocationMapProps) => {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <LazyMapContent lat={lat} lng={lng} address={address} />
    </Suspense>
  );
};

export default LocationMap;
