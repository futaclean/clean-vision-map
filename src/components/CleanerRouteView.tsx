import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Clock, Ruler, Route as RouteIcon, RefreshCw, ClipboardList, CheckCircle, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Report {
  id: string;
  location_lat: number;
  location_lng: number;
  location_address?: string | null;
  waste_type?: string | null;
  severity?: string | null;
  status: string;
}

interface CleanerRouteViewProps {
  reports: Report[];
  cleanerId: string;
  onReportComplete?: () => void;
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

export const CleanerRouteView = ({ reports, cleanerId, onReportComplete }: CleanerRouteViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routingControlRef = useRef<any>(null);
  const [cleanerLocation, setCleanerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cleanerName, setCleanerName] = useState<string>("");
  const [optimizedRoute, setOptimizedRoute] = useState<Report[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoCalculated, setAutoCalculated] = useState(false);
  const [quickCompleteDialog, setQuickCompleteDialog] = useState(false);
  const [selectedReportForComplete, setSelectedReportForComplete] = useState<Report | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch cleaner's location
  useEffect(() => {
    const fetchCleanerLocation = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('location_lat, location_lng, location_address, full_name')
        .eq('id', cleanerId)
        .single();

      if (error) {
        console.error('Error fetching cleaner location:', error);
        return;
      }

      if (data?.location_lat && data?.location_lng) {
        setCleanerLocation({
          lat: data.location_lat,
          lng: data.location_lng
        });
        setCleanerName(data.full_name);
      }
    };

    fetchCleanerLocation();
  }, [cleanerId]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const defaultLat = cleanerLocation?.lat || 6.4541;
    const defaultLng = cleanerLocation?.lng || 3.3947;

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

  // Auto-calculate route when location and reports are ready
  useEffect(() => {
    if (cleanerLocation && reports.length > 0 && !autoCalculated) {
      calculateOptimalRoute();
      setAutoCalculated(true);
    }
  }, [cleanerLocation, reports.length]);

  const calculateOptimalRoute = () => {
    if (!cleanerLocation || reports.length === 0) return;
    
    setIsCalculating(true);

    // Optimize route using nearest neighbor algorithm
    const optimized = optimizeRoute(cleanerLocation, reports);
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
    displayRouteOnMap(optimized);
    setIsCalculating(false);

    toast({
      title: "Route calculated",
      description: `Optimized route for ${optimized.length} location${optimized.length !== 1 ? 's' : ''}`,
    });
  };

  const displayRouteOnMap = (route: Report[]) => {
    if (!mapRef.current || !cleanerLocation) return;

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
            ">🏠</div>
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
          const popupContent = document.createElement('div');
          popupContent.className = 'p-3 min-w-[200px]';
          popupContent.innerHTML = `
            <div class="space-y-2">
              <p class="font-semibold text-sm">Stop ${i}</p>
              ${report.location_address ? `<p class="text-xs mt-1">${report.location_address}</p>` : ''}
              ${report.waste_type ? `<p class="text-xs text-gray-600">Type: ${report.waste_type}</p>` : ''}
              ${report.severity ? `<p class="text-xs text-gray-600">Severity: ${report.severity}</p>` : ''}
              <button 
                id="complete-btn-${report.id}"
                class="w-full mt-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Quick Complete
              </button>
            </div>
          `;
          
          const popup = L.popup().setContent(popupContent);
          marker.bindPopup(popup);
          
          // Add event listener after popup opens
          marker.on('popupopen', () => {
            const btn = document.getElementById(`complete-btn-${report.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                handleQuickComplete(report);
                marker.closePopup();
              });
            }
          });
        } else {
          marker.bindPopup(`
            <div class="p-2">
              <p class="font-semibold text-sm">Your Location</p>
              <p class="text-xs text-gray-600">${cleanerName}</p>
            </div>
          `);
        }

        return marker;
      }
    }).addTo(mapRef.current);

    routingControlRef.current = routingControl;
  };

  const handleQuickComplete = (report: Report) => {
    setSelectedReportForComplete(report);
    setQuickCompleteDialog(true);
  };

  const confirmQuickComplete = async () => {
    if (!selectedReportForComplete) return;

    setIsCompleting(true);

    try {
      const { error } = await supabase
        .from('waste_reports')
        .update({ 
          status: 'resolved'
        })
        .eq('id', selectedReportForComplete.id);

      if (error) throw error;

      toast({
        title: "Report Completed!",
        description: "The report has been marked as resolved. Great work!",
      });

      // Notify parent to refresh reports
      if (onReportComplete) {
        onReportComplete();
      }

      // Remove completed report from optimized route
      setOptimizedRoute(prev => prev.filter(r => r.id !== selectedReportForComplete.id));
      
      setQuickCompleteDialog(false);
      setSelectedReportForComplete(null);

      // Recalculate route if there are remaining reports
      if (optimizedRoute.length > 1) {
        setTimeout(() => calculateOptimalRoute(), 500);
      }
    } catch (error: any) {
      console.error('Error completing report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete report",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (!cleanerLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Your Optimized Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Location Not Set</p>
            <p className="text-sm mt-2">
              Your location hasn't been set yet. Please contact an administrator to set your location for route optimization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Your Optimized Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Active Reports</p>
            <p className="text-sm mt-2">
              You don't have any active assigned reports to create a route for.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Your Optimized Route
              </CardTitle>
              <CardDescription>
                Most efficient path to visit all {reports.length} assigned location{reports.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button 
              onClick={calculateOptimalRoute}
              disabled={isCalculating}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {optimizedRoute.length > 0 && (
            <>
              {/* Route Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Stops</p>
                    <p className="text-lg font-bold">{optimizedRoute.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <Ruler className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-lg font-bold">{totalDistance.toFixed(1)} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="text-lg font-bold">{Math.round(estimatedTime)} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <Navigation className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Optimized</p>
                    <p className="text-lg font-bold">Yes</p>
                  </div>
                </div>
              </div>

              {/* Route Order List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Visit Order:</h4>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                      🏠
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Start: Your Location</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {cleanerName}
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => handleQuickComplete(report)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
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
          <h4 className="text-sm font-semibold mb-2">Route Info:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Route optimized to minimize travel distance</li>
            <li>• Follow the numbered sequence for most efficient path</li>
            <li>• Time estimate includes 15 minutes per stop</li>
            <li>• Map shows turn-by-turn directions</li>
            <li>• Use "Complete" button for quick marking without uploading photos</li>
          </ul>
        </div>
      )}

      {/* Quick Complete Dialog */}
      <AlertDialog open={quickCompleteDialog} onOpenChange={setQuickCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this report?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You're about to mark this report as completed without uploading a completion photo.
              </p>
              {selectedReportForComplete && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {selectedReportForComplete.location_address || 'Unknown location'}
                  </p>
                  <div className="flex gap-2">
                    {selectedReportForComplete.waste_type && (
                      <Badge variant="outline" className="text-xs">
                        {selectedReportForComplete.waste_type}
                      </Badge>
                    )}
                    {selectedReportForComplete.severity && (
                      <Badge variant="outline" className="text-xs">
                        {selectedReportForComplete.severity}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Camera className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  You can upload a completion photo later from the full report view in your dashboard if needed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmQuickComplete}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
