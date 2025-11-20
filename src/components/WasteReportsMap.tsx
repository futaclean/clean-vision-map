import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
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

const getMarkerColor = (status: string | null): string => {
  switch (status) {
    case 'resolved':
      return '#22c55e'; // green
    case 'in_progress':
      return '#eab308'; // yellow
    case 'rejected':
      return '#3b82f6'; // blue
    case 'pending':
    default:
      return '#ef4444'; // red
  }
};

const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const markers = cluster.getAllChildMarkers();
  
  // Determine cluster color based on the most severe status
  const statuses = markers.map((m: any) => m.options.status);
  const hasPending = statuses.includes('pending');
  const hasInProgress = statuses.includes('in_progress');
  const hasRejected = statuses.includes('rejected');
  const hasResolved = statuses.includes('resolved');
  
  let clusterColor = '#6b7280'; // default gray
  if (hasPending) clusterColor = '#ef4444'; // red for pending (highest priority)
  else if (hasInProgress) clusterColor = '#eab308'; // yellow for in-progress
  else if (hasRejected) clusterColor = '#3b82f6'; // blue for rejected
  else if (hasResolved) clusterColor = '#22c55e'; // green for all resolved
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${clusterColor};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 4px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-weight: bold;
        color: white;
        font-size: 14px;
      ">${count}</div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40, true),
  });
};

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
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {reports.map((report) => {
            const markerColor = getMarkerColor(report.status);
            const customIcon = createColoredIcon(markerColor);
            
            return (
              <Marker
                key={report.id}
                // @ts-ignore - react-leaflet types issue with custom icons
                position={[report.location_lat, report.location_lng]}
                // @ts-ignore
                icon={customIcon}
                // @ts-ignore - custom property for cluster coloring
                status={report.status}
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
          );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
