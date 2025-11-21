import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface CleanerLocation {
  id: string;
  full_name: string;
  email: string;
  current_lat: number;
  current_lng: number;
  location_updated_at: string;
  is_tracking_enabled: boolean;
}

interface WasteReport {
  id: string;
  location_lat: number;
  location_lng: number;
  location_address: string | null;
  status: string;
  waste_type: string | null;
  assigned_to: string | null;
}

export const CleanersOverviewMap = () => {
  const [cleaners, setCleaners] = useState<CleanerLocation[]>([]);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCleanersAndReports();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel('cleaner-locations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'is_tracking_enabled=eq.true',
        },
        (payload) => {
          console.log('Location update received:', payload);
          setCleaners((current) =>
            current.map((cleaner) =>
              cleaner.id === payload.new.id
                ? {
                    ...cleaner,
                    current_lat: payload.new.current_lat,
                    current_lng: payload.new.current_lng,
                    location_updated_at: payload.new.location_updated_at,
                  }
                : cleaner
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCleanersAndReports = async () => {
    setLoading(true);

    // Fetch active cleaners with location tracking enabled
    const { data: cleanersData } = await supabase
      .from('profiles')
      .select('id, full_name, email, current_lat, current_lng, location_updated_at, is_tracking_enabled')
      .eq('is_tracking_enabled', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (cleanersData) {
      setCleaners(cleanersData as CleanerLocation[]);
    }

    // Fetch in-progress reports
    const { data: reportsData } = await supabase
      .from('waste_reports')
      .select('id, location_lat, location_lng, location_address, status, waste_type, assigned_to')
      .eq('status', 'in_progress');

    if (reportsData) {
      setReports(reportsData as WasteReport[]);
    }

    setLoading(false);
  };

  const cleanerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const reportIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const getTimeSinceUpdate = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - updated.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getAssignedReports = (cleanerId: string) => {
    return reports.filter((report) => report.assigned_to === cleanerId);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      </Card>
    );
  }

  const center: [number, number] = cleaners.length > 0
    ? [cleaners[0].current_lat, cleaners[0].current_lng]
    : [6.5244, 3.3792]; // Lagos coordinates as fallback

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{cleaners.length}</div>
              <div className="text-sm text-muted-foreground">Active Cleaners</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-2xl font-bold">{reports.length}</div>
              <div className="text-sm text-muted-foreground">In Progress Reports</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <div className="text-2xl font-bold">
                {cleaners.filter(c => new Date().getTime() - new Date(c.location_updated_at).getTime() < 60000).length}
              </div>
              <div className="text-sm text-muted-foreground">Live Now</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '600px', width: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Render cleaner locations */}
          {cleaners.map((cleaner) => {
            const assignedReports = getAssignedReports(cleaner.id);
            return (
              <div key={cleaner.id}>
                <Marker
                  position={[cleaner.current_lat, cleaner.current_lng]}
                  icon={cleanerIcon}
                >
                  <Popup>
                    <div className="space-y-2">
                      <div className="font-semibold">{cleaner.full_name}</div>
                      <div className="text-sm text-muted-foreground">{cleaner.email}</div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeSinceUpdate(cleaner.location_updated_at)}
                      </Badge>
                      {assignedReports.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Active tasks:</span> {assignedReports.length}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Draw lines to assigned reports */}
                {assignedReports.map((report) => (
                  <Polyline
                    key={`line-${cleaner.id}-${report.id}`}
                    positions={[
                      [cleaner.current_lat, cleaner.current_lng],
                      [Number(report.location_lat), Number(report.location_lng)]
                    ]}
                    pathOptions={{ color: 'green', weight: 2, opacity: 0.6, dashArray: '5, 10' }}
                  />
                ))}
              </div>
            );
          })}

          {/* Render report locations */}
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[Number(report.location_lat), Number(report.location_lng)]}
              icon={reportIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">Waste Report</div>
                  <div className="text-sm">{report.location_address || 'No address'}</div>
                  <Badge variant="outline" className="text-xs">
                    {report.waste_type || 'Unknown type'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {report.status}
                  </Badge>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>

      {cleaners.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          No active cleaners with location tracking enabled. Cleaners need to enable GPS tracking from their dashboard.
        </Card>
      )}
    </div>
  );
};
