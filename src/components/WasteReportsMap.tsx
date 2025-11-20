import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WasteReport {
  id: string;
  location_lat: number;
  location_lng: number;
  status: string | null;
  severity: string | null;
  waste_type: string | null;
  description: string | null;
  location_address: string | null;
  created_at: string | null;
}

interface WasteReportsMapProps {
  reports: WasteReport[];
  onReportClick?: (report: WasteReport) => void;
}

export const WasteReportsMap = ({ reports, onReportClick }: WasteReportsMapProps) => {
  const center: [number, number] = reports.length > 0 
    ? [reports[0].location_lat, reports[0].location_lng]
    : [0, 0];

  const getStatusBadge = (status: string | null) => {
    const variant = status === 'resolved' ? 'default' : 
                    status === 'in_progress' ? 'secondary' : 
                    status === 'rejected' ? 'destructive' : 'outline';
    return <Badge variant={variant}>{status || 'pending'}</Badge>;
  };

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border">
      <MapContainer
        // @ts-ignore - react-leaflet types issue
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={report.id}
            // @ts-ignore - react-leaflet types issue
            position={[report.location_lat, report.location_lng]}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Waste Report</h3>
                  {getStatusBadge(report.status)}
                </div>
                <div className="space-y-1 text-sm">
                  {report.waste_type && (
                    <p><strong>Type:</strong> {report.waste_type}</p>
                  )}
                  {report.severity && (
                    <p><strong>Severity:</strong> {report.severity}</p>
                  )}
                  {report.location_address && (
                    <p><strong>Location:</strong> {report.location_address}</p>
                  )}
                  {report.description && (
                    <p className="line-clamp-2"><strong>Description:</strong> {report.description}</p>
                  )}
                  {report.created_at && (
                    <p className="text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => onReportClick?.(report)}
                >
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
