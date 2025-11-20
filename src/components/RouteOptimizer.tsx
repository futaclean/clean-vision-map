import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, Clock, Route as RouteIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WasteReport {
  id: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  waste_type: string;
  severity: string;
  status: string;
  created_at: string;
}

interface RouteOptimizerProps {
  reports: WasteReport[];
  onRouteCalculated?: (distance: number, duration: number) => void;
}

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RoutingControlProps {
  waypoints: L.LatLng[];
  onRoutesFound: (routes: any) => void;
}

const RoutingControl = ({ waypoints, onRoutesFound }: RoutingControlProps) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create new routing control
    const routingControl = (L as any).Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }]
      },
      createMarker: (i: number, waypoint: any, n: number) => {
        const isStart = i === 0;
        const isEnd = i === n - 1;
        
        const icon = L.divIcon({
          html: `
            <div style="
              background-color: ${isStart ? '#10b981' : isEnd ? '#ef4444' : '#3b82f6'};
              color: white;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              ${isStart ? '🚀' : isEnd ? '🏁' : i}
            </div>
          `,
          className: 'custom-routing-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        return L.marker(waypoint.latLng, { icon });
      }
    }).addTo(map);

    routingControl.on('routesfound', (e: any) => {
      onRoutesFound(e.routes[0]);
    });

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, waypoints, onRoutesFound]);

  return null;
};

export const RouteOptimizer = ({ reports, onRouteCalculated }: RouteOptimizerProps) => {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);

  const handleToggleReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  const optimizeRoute = () => {
    if (selectedReports.length < 2) return;
    setOptimizing(true);
    
    // Simple nearest neighbor algorithm for route optimization
    const selectedReportObjects = reports.filter(r => selectedReports.includes(r.id));
    const optimized = nearestNeighborTSP(selectedReportObjects);
    setSelectedReports(optimized.map(r => r.id));
    
    setTimeout(() => setOptimizing(false), 500);
  };

  // Simple Traveling Salesman Problem solver using nearest neighbor
  const nearestNeighborTSP = (locations: WasteReport[]): WasteReport[] => {
    if (locations.length <= 1) return locations;

    const result: WasteReport[] = [];
    const remaining = [...locations];
    
    // Start with the first location
    let current = remaining.shift()!;
    result.push(current);

    // Greedily pick nearest unvisited location
    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(
          current.location_lat,
          current.location_lng,
          remaining[i].location_lat,
          remaining[i].location_lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestIdx = i;
        }
      }

      current = remaining.splice(nearestIdx, 1)[0];
      result.push(current);
    }

    return result;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleRoutesFound = (route: any) => {
    setRouteInfo(route);
    if (onRouteCalculated) {
      const distance = route.summary.totalDistance / 1000; // Convert to km
      const duration = route.summary.totalTime / 60; // Convert to minutes
      onRouteCalculated(distance, duration);
    }
  };

  const selectedReportObjects = reports.filter(r => selectedReports.includes(r.id));
  const waypoints = selectedReportObjects.map(r => L.latLng(r.location_lat, r.location_lng));

  const center: [number, number] = reports.length > 0
    ? [reports[0].location_lat, reports[0].location_lng]
    : [7.3046, 5.1414]; // FUTA coordinates as fallback

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Report Selection Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Route Planner
          </CardTitle>
          <CardDescription>
            Select locations to optimize your route
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              className="flex-1"
            >
              {selectedReports.length === reports.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button 
              size="sm"
              onClick={optimizeRoute}
              disabled={selectedReports.length < 2 || optimizing}
              className="flex-1"
            >
              {optimizing ? 'Optimizing...' : 'Optimize Route'}
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedReports.includes(report.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleToggleReport(report.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {selectedReports.includes(report.id) && (
                          <Badge variant="secondary" className="text-xs">
                            #{selectedReports.indexOf(report.id) + 1}
                          </Badge>
                        )}
                        <span className="font-medium text-sm capitalize truncate">
                          {report.waste_type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {report.location_address}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedReports.includes(report.id)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedReports.includes(report.id) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Route Summary */}
          {routeInfo && selectedReports.length >= 2 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-sm">Route Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Navigation className="h-4 w-4" />
                    <span className="text-xs">Distance</span>
                  </div>
                  <p className="text-lg font-bold">
                    {(routeInfo.summary.totalDistance / 1000).toFixed(1)} km
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Duration</span>
                  </div>
                  <p className="text-lg font-bold">
                    {Math.round(routeInfo.summary.totalTime / 60)} min
                  </p>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">Stops</span>
                </div>
                <p className="text-lg font-bold">{selectedReports.length} locations</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
          <CardDescription>
            Visual representation of your optimized route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] rounded-lg overflow-hidden border">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {waypoints.length >= 2 && (
                <RoutingControl 
                  waypoints={waypoints} 
                  onRoutesFound={handleRoutesFound}
                />
              )}

              {waypoints.length < 2 && reports.map((report) => (
                <Marker
                  key={report.id}
                  position={[report.location_lat, report.location_lng]}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold capitalize">{report.waste_type}</p>
                      <p className="text-sm text-muted-foreground">{report.location_address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {selectedReports.length === 0 && (
            <p className="text-center text-muted-foreground mt-4">
              Select at least 2 locations to generate a route
            </p>
          )}
          {selectedReports.length === 1 && (
            <p className="text-center text-muted-foreground mt-4">
              Select at least one more location to generate a route
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
