import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation, MapPin, Clock, Ruler, Route as RouteIcon } from 'lucide-react';

interface Report {
  id: string;
  location_lat: number;
  location_lng: number;
  location_address?: string | null;
  waste_type?: string | null;
  severity?: string | null;
  status: string;
}

interface Cleaner {
  id: string;
  full_name: string;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
}

interface CleanerRouteOptimizerProps {
  cleaners: Cleaner[];
  reports: Report[];
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Nearest neighbor algorithm for route optimization
const optimizeRoute = (
  startLocation: { lat: number; lng: number },
  reports: Report[]
): Report[] => {
  if (reports.length === 0) return [];
  if (reports.length === 1) return reports;

  const unvisited = [...reports];
  const route: Report[] = [];
  let currentLocation = startLocation;

  // Greedy nearest neighbor algorithm
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      unvisited[0].location_lat,
      unvisited[0].location_lng
    );

    // Find nearest unvisited report
    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        unvisited[i].location_lat,
        unvisited[i].location_lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    // Add nearest to route and remove from unvisited
    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push(nearest);
    currentLocation = { lat: nearest.location_lat, lng: nearest.location_lng };
  }

  return route;
};

export const CleanerRouteOptimizer = ({ cleaners, reports }: CleanerRouteOptimizerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routingControlRef = useRef<any>(null);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>("");
  const [optimizedRoute, setOptimizedRoute] = useState<Report[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  const selectedCleaner = cleaners.find(c => c.id === selectedCleanerId);
  const cleanerReports = reports.filter(
    r => r.status !== 'resolved' && r.status !== 'rejected' 
  ).filter(r => {
    // For this view, show reports assigned to selected cleaner
    const reportAssignedTo = (r as any).assigned_to;
    return reportAssignedTo === selectedCleanerId;
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const defaultLat = 6.4541;
    const defaultLng = 3.3947;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const calculateOptimalRoute = () => {
    if (!selectedCleaner || !selectedCleaner.location_lat || !selectedCleaner.location_lng) {
      return;
    }

    if (cleanerReports.length === 0) return;

    const cleanerLocation = {
      lat: selectedCleaner.location_lat,
      lng: selectedCleaner.location_lng
    };

    // Optimize route using nearest neighbor algorithm
    const optimized = optimizeRoute(cleanerLocation, cleanerReports);
    setOptimizedRoute(optimized);

    // Calculate total distance
    let distance = 0;
    let currentLoc = cleanerLocation;

    for (const report of optimized) {
      distance += calculateDistance(
        currentLoc.lat,
        currentLoc.lng,
        report.location_lat,
        report.location_lng
      );
      currentLoc = { lat: report.location_lat, lng: report.location_lng };
    }

    setTotalDistance(distance);
    // Estimate time: assuming 30 km/h average speed in city + 15 min per stop
    setEstimatedTime((distance / 30) * 60 + optimized.length * 15);

    // Display route on map
    displayRouteOnMap(cleanerLocation, optimized);
  };

  const displayRouteOnMap = (cleanerLocation: { lat: number; lng: number }, route: Report[]) => {
    if (!mapRef.current) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
    }

    // Create waypoints array (cleaner location + all reports)
    const waypoints = [
      L.latLng(cleanerLocation.lat, cleanerLocation.lng),
      ...route.map(report => L.latLng(report.location_lat, report.location_lng))
    ];

    // Create routing control
    const routingControl = (L as any).Routing.control({
      waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#6366f1', opacity: 0.8, weight: 5 }]
      },
      createMarker: (i: number, waypoint: any, n: number) => {
        const isStart = i === 0;
        
        let iconHtml = '';
        if (isStart) {
          iconHtml = `
            <div style="
              background-color: #22c55e;
              width: 35px;
              height: 35px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 16px;
            ">S</div>
          `;
        } else {
          const reportIndex = i - 1;
          iconHtml = `
            <div style="
              background-color: #3b82f6;
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
            ">${reportIndex + 1}</div>
          `;
        }

        const icon = L.divIcon({
          className: 'custom-route-marker',
          html: iconHtml,
          iconSize: [35, 35],
          iconAnchor: [17.5, 17.5],
        });

        const marker = L.marker(waypoint.latLng, { icon });

        // Add popup
        if (!isStart) {
          const report = route[i - 1];
          marker.bindPopup(`
            <div class="p-2">
              <p class="font-semibold text-sm">Stop ${i}</p>
              ${report.location_address ? `<p class="text-xs mt-1">${report.location_address}</p>` : ''}
              ${report.waste_type ? `<p class="text-xs text-gray-600">Type: ${report.waste_type}</p>` : ''}
              ${report.severity ? `<p class="text-xs text-gray-600">Severity: ${report.severity}</p>` : ''}
            </div>
          `);
        } else {
          marker.bindPopup(`
            <div class="p-2">
              <p class="font-semibold text-sm">Start Location</p>
              <p class="text-xs text-gray-600">${selectedCleaner?.full_name}</p>
            </div>
          `);
        }

        return marker;
      }
    }).addTo(mapRef.current);

    routingControlRef.current = routingControl;
  };

  return (
    <div className="space-y-4">
      {/* Cleaner Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Route Optimization
          </CardTitle>
          <CardDescription>
            Calculate the most efficient route for cleaners to visit assigned locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Cleaner</label>
              <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cleaner" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners
                    .filter(c => c.location_lat != null && c.location_lng != null)
                    .map(cleaner => {
                      const assignedCount = reports.filter(
                        r => (r as any).assigned_to === cleaner.id && 
                        r.status !== 'resolved' && 
                        r.status !== 'rejected'
                      ).length;
                      return (
                        <SelectItem key={cleaner.id} value={cleaner.id}>
                          {cleaner.full_name} ({assignedCount} active)
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={calculateOptimalRoute}
                disabled={!selectedCleanerId || cleanerReports.length === 0}
                className="w-full sm:w-auto"
              >
                Calculate Route
              </Button>
            </div>
          </div>

          {selectedCleanerId && cleanerReports.length === 0 && (
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This cleaner has no active assigned reports to optimize.
              </p>
            </div>
          )}

          {selectedCleanerId && !selectedCleaner?.location_lat && (
            <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                This cleaner's location has not been set. Please set their location in the Cleaners tab.
              </p>
            </div>
          )}

          {optimizedRoute.length > 0 && (
            <>
              {/* Route Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Stops</p>
                    <p className="text-lg font-bold">{optimizedRoute.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Ruler className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-lg font-bold">{totalDistance.toFixed(1)} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="text-lg font-bold">{Math.round(estimatedTime)} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Navigation className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Optimized</p>
                    <p className="text-lg font-bold">Yes</p>
                  </div>
                </div>
              </div>

              {/* Route Order List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Optimized Visit Order:</h4>
                <div className="max-h-[250px] overflow-y-auto space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                      S
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Start: {selectedCleaner?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedCleaner?.location_address || 'Cleaner Location'}
                      </p>
                    </div>
                  </div>
                  {optimizedRoute.map((report, index) => (
                    <div 
                      key={report.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {report.location_address || `Location ${index + 1}`}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {report.waste_type && (
                            <Badge variant="outline" className="text-xs">
                              {report.waste_type}
                            </Badge>
                          )}
                          {report.severity && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                report.severity === 'high' ? 'border-red-500 text-red-600' :
                                report.severity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                                'border-green-500 text-green-600'
                              }`}
                            >
                              {report.severity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[600px] rounded-lg border border-border overflow-hidden"
      />

      {optimizedRoute.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Route Optimization Algorithm:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Uses nearest neighbor algorithm (greedy approach)</li>
            <li>• Starts from cleaner's location</li>
            <li>• Visits nearest unvisited location at each step</li>
            <li>• Minimizes total travel distance</li>
            <li>• Time estimate: 30 km/h avg speed + 15 min per stop</li>
            <li>• Route displayed with turn-by-turn navigation</li>
          </ul>
        </div>
      )}
    </div>
  );
};
