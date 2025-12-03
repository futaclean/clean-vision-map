import { lazy, Suspense, Component, ReactNode } from "react";
import MapSkeleton from "./MapSkeleton";
import { AlertCircle } from "lucide-react";

interface LocationMapProps {
  lat: number;
  lng: number;
  address?: string;
}

// Simple error boundary for the map
class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Map loading error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Lazy load the actual map component
const LazyMapContent = lazy(() => import("./LocationMapContent"));

const MapFallback = ({ lat, lng }: { lat: number; lng: number }) => (
  <div className="w-full h-64 rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-2">
    <AlertCircle className="h-8 w-8 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">Map unavailable</p>
    <p className="text-xs text-muted-foreground">
      Location: {lat.toFixed(6)}, {lng.toFixed(6)}
    </p>
  </div>
);

const LocationMap = ({ lat, lng, address }: LocationMapProps) => {
  return (
    <MapErrorBoundary fallback={<MapFallback lat={lat} lng={lng} />}>
      <Suspense fallback={<MapSkeleton />}>
        <LazyMapContent lat={lat} lng={lng} address={address} />
      </Suspense>
    </MapErrorBoundary>
  );
};

export default LocationMap;
