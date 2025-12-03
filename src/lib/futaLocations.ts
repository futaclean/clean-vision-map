// FUTA Campus Landmarks with coordinates
export interface FUTALandmark {
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters - how close you need to be to match
}

export const FUTA_LANDMARKS: FUTALandmark[] = [
  // Gates
  { name: "FUTA South Gate", lat: 7.2985, lng: 5.1378, radius: 100 },
  { name: "FUTA North Gate", lat: 7.3105, lng: 5.1365, radius: 100 },
  { name: "FUTA Main Gate", lat: 7.3034, lng: 5.1320, radius: 100 },
  
  // Academic Buildings
  { name: "FUTA Main Lecture Theatre (MLT)", lat: 7.3045, lng: 5.1368, radius: 80 },
  { name: "FUTA Little Lecture Theatre (LLT)", lat: 7.3038, lng: 5.1372, radius: 80 },
  { name: "FUTA Senate Building", lat: 7.3040, lng: 5.1355, radius: 80 },
  { name: "FUTA ICT Centre", lat: 7.3052, lng: 5.1380, radius: 80 },
  { name: "FUTA Library", lat: 7.3048, lng: 5.1360, radius: 80 },
  { name: "FUTA Engineering Complex", lat: 7.3055, lng: 5.1345, radius: 100 },
  { name: "FUTA SEET Building", lat: 7.3060, lng: 5.1350, radius: 80 },
  { name: "FUTA SAAT Building", lat: 7.3025, lng: 5.1385, radius: 80 },
  { name: "FUTA SOS Building", lat: 7.3030, lng: 5.1365, radius: 80 },
  { name: "FUTA SEMS Building", lat: 7.3042, lng: 5.1390, radius: 80 },
  
  // Hostels
  { name: "FUTA Hall A (Joseph Ayo Babalola Hall)", lat: 7.3000, lng: 5.1400, radius: 100 },
  { name: "FUTA Hall B (Obafemi Awolowo Hall)", lat: 7.3005, lng: 5.1410, radius: 100 },
  { name: "FUTA Hall C (Wole Soyinka Hall)", lat: 7.3010, lng: 5.1420, radius: 100 },
  { name: "FUTA Hall D (Ahmadu Bello Hall)", lat: 7.3015, lng: 5.1430, radius: 100 },
  { name: "FUTA PG Hostel", lat: 7.3020, lng: 5.1440, radius: 100 },
  { name: "FUTA Female Hostel", lat: 7.2995, lng: 5.1395, radius: 100 },
  
  // Other Facilities
  { name: "FUTA Sports Complex", lat: 7.3070, lng: 5.1335, radius: 120 },
  { name: "FUTA Health Centre", lat: 7.3035, lng: 5.1340, radius: 80 },
  { name: "FUTA Cafeteria", lat: 7.3028, lng: 5.1375, radius: 60 },
  { name: "FUTA Banking Area", lat: 7.3032, lng: 5.1358, radius: 60 },
  { name: "FUTA Car Park", lat: 7.3025, lng: 5.1350, radius: 80 },
  { name: "FUTA Administrative Block", lat: 7.3038, lng: 5.1348, radius: 80 },
  { name: "FUTA Entrepreneurship Centre", lat: 7.3065, lng: 5.1395, radius: 80 },
  { name: "FUTA STEP-B Building", lat: 7.3075, lng: 5.1375, radius: 80 },
];

// Calculate distance between two coordinates in meters (Haversine formula)
function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if coordinates are within FUTA campus bounds
export function isWithinFUTA(lat: number, lng: number): boolean {
  // FUTA campus approximate bounds
  const bounds = {
    north: 7.3150,
    south: 7.2900,
    east: 5.1500,
    west: 5.1250
  };
  
  return lat >= bounds.south && lat <= bounds.north && 
         lng >= bounds.west && lng <= bounds.east;
}

// Find the nearest FUTA landmark to given coordinates
export function findNearestLandmark(lat: number, lng: number): { landmark: FUTALandmark | null; distance: number } {
  let nearestLandmark: FUTALandmark | null = null;
  let minDistance = Infinity;
  
  for (const landmark of FUTA_LANDMARKS) {
    const distance = getDistanceInMeters(lat, lng, landmark.lat, landmark.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLandmark = landmark;
    }
  }
  
  return { landmark: nearestLandmark, distance: minDistance };
}

// Get FUTA-specific location name based on coordinates
export function getFUTALocationName(lat: number, lng: number): string | null {
  if (!isWithinFUTA(lat, lng)) {
    return null; // Not within FUTA campus
  }
  
  const { landmark, distance } = findNearestLandmark(lat, lng);
  
  if (landmark && distance <= landmark.radius) {
    return landmark.name;
  }
  
  // If within FUTA but not near any specific landmark
  if (isWithinFUTA(lat, lng)) {
    // Find the closest landmark even if outside its radius
    if (landmark && distance <= 300) {
      return `Near ${landmark.name}`;
    }
    return "FUTA Campus";
  }
  
  return null;
}
