// FUTA Campus Landmarks with coordinates
export interface FUTALandmark {
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters - how close you need to be to match
}

export const FUTA_LANDMARKS: FUTALandmark[] = [
  // Gates (smaller radius for precise detection)
  { name: "FUTA South Gate", lat: 7.2985, lng: 5.1378, radius: 30 },
  { name: "FUTA North Gate", lat: 7.3105, lng: 5.1365, radius: 30 },
  { name: "FUTA Main Gate (Obanla Gate)", lat: 7.3034, lng: 5.1320, radius: 30 },
  { name: "FUTA ABUAD Gate", lat: 7.3080, lng: 5.1420, radius: 30 },
  
  // Lecture Theatres
  { name: "FUTA Main Lecture Theatre (MLT)", lat: 7.3045, lng: 5.1368, radius: 35 },
  { name: "FUTA Little Lecture Theatre (LLT)", lat: 7.3038, lng: 5.1372, radius: 30 },
  { name: "FUTA 500 Capacity Lecture Theatre", lat: 7.3050, lng: 5.1362, radius: 35 },
  { name: "FUTA ETF Lecture Theatre", lat: 7.3055, lng: 5.1358, radius: 35 },
  
  // Administrative Buildings
  { name: "FUTA Senate Building", lat: 7.3040, lng: 5.1355, radius: 30 },
  { name: "FUTA Administrative Block", lat: 7.3038, lng: 5.1348, radius: 30 },
  { name: "FUTA Vice Chancellor's Office", lat: 7.3042, lng: 5.1350, radius: 25 },
  { name: "FUTA Registry", lat: 7.3036, lng: 5.1345, radius: 25 },
  { name: "FUTA Bursary", lat: 7.3034, lng: 5.1342, radius: 25 },
  
  // Schools/Faculties (slightly larger for building complexes)
  { name: "FUTA SEET (School of Engineering)", lat: 7.3060, lng: 5.1350, radius: 40 },
  { name: "FUTA SAAT (School of Agriculture)", lat: 7.3025, lng: 5.1385, radius: 40 },
  { name: "FUTA SOS (School of Sciences)", lat: 7.3030, lng: 5.1365, radius: 40 },
  { name: "FUTA SEMS (School of Earth & Mineral Sciences)", lat: 7.3042, lng: 5.1390, radius: 40 },
  { name: "FUTA SICT (School of Computing)", lat: 7.3052, lng: 5.1380, radius: 40 },
  { name: "FUTA SOHT (School of Health Tech)", lat: 7.3048, lng: 5.1395, radius: 40 },
  { name: "FUTA SOMT (School of Management Tech)", lat: 7.3035, lng: 5.1388, radius: 40 },
  
  // Department Buildings (strict building-level detection)
  { name: "FUTA Computer Science Department", lat: 7.3054, lng: 5.1382, radius: 25 },
  { name: "FUTA Electrical Engineering Department", lat: 7.3062, lng: 5.1355, radius: 25 },
  { name: "FUTA Mechanical Engineering Department", lat: 7.3058, lng: 5.1348, radius: 25 },
  { name: "FUTA Civil Engineering Department", lat: 7.3065, lng: 5.1352, radius: 25 },
  { name: "FUTA Chemical Engineering Department", lat: 7.3068, lng: 5.1358, radius: 25 },
  { name: "FUTA Physics Department", lat: 7.3028, lng: 5.1362, radius: 25 },
  { name: "FUTA Chemistry Department", lat: 7.3032, lng: 5.1368, radius: 25 },
  { name: "FUTA Mathematics Department", lat: 7.3026, lng: 5.1358, radius: 25 },
  { name: "FUTA Biology Department", lat: 7.3030, lng: 5.1370, radius: 25 },
  { name: "FUTA Biochemistry Department", lat: 7.3033, lng: 5.1372, radius: 25 },
  { name: "FUTA Microbiology Department", lat: 7.3035, lng: 5.1375, radius: 25 },
  { name: "FUTA Architecture Department", lat: 7.3070, lng: 5.1345, radius: 25 },
  { name: "FUTA Industrial Design Department", lat: 7.3072, lng: 5.1348, radius: 25 },
  
  // Hostels - Male (per-hostel detection)
  { name: "FUTA Hall A (Joseph Ayo Babalola Hall)", lat: 7.3000, lng: 5.1400, radius: 35 },
  { name: "FUTA Hall B (Obafemi Awolowo Hall)", lat: 7.3005, lng: 5.1410, radius: 35 },
  { name: "FUTA Hall C (Wole Soyinka Hall)", lat: 7.3010, lng: 5.1420, radius: 35 },
  { name: "FUTA Hall D (Ahmadu Bello Hall)", lat: 7.3015, lng: 5.1430, radius: 35 },
  { name: "FUTA Hall E (Nnamdi Azikiwe Hall)", lat: 7.3020, lng: 5.1435, radius: 35 },
  { name: "FUTA PG Hostel (Male)", lat: 7.3022, lng: 5.1440, radius: 35 },
  
  // Hostels - Female
  { name: "FUTA Female Hostel (Queen Amina Hall)", lat: 7.2995, lng: 5.1395, radius: 35 },
  { name: "FUTA Female Hostel (Queen Moremi Hall)", lat: 7.2992, lng: 5.1400, radius: 35 },
  { name: "FUTA Female Hostel (Funmilayo Hall)", lat: 7.2990, lng: 5.1405, radius: 35 },
  { name: "FUTA PG Hostel (Female)", lat: 7.2988, lng: 5.1408, radius: 35 },
  
  // Libraries & Learning Centres
  { name: "FUTA Main Library", lat: 7.3048, lng: 5.1360, radius: 30 },
  { name: "FUTA ICT Centre", lat: 7.3052, lng: 5.1378, radius: 30 },
  { name: "FUTA e-Library", lat: 7.3050, lng: 5.1365, radius: 25 },
  
  // Sports & Recreation
  { name: "FUTA Sports Complex", lat: 7.3070, lng: 5.1335, radius: 50 },
  { name: "FUTA Football Field", lat: 7.3068, lng: 5.1330, radius: 40 },
  { name: "FUTA Basketball Court", lat: 7.3072, lng: 5.1340, radius: 25 },
  { name: "FUTA Tennis Court", lat: 7.3074, lng: 5.1338, radius: 20 },
  { name: "FUTA Swimming Pool", lat: 7.3076, lng: 5.1342, radius: 20 },
  { name: "FUTA Student Union Building (SUB)", lat: 7.3040, lng: 5.1385, radius: 30 },
  
  // Food & Commercial Areas
  { name: "FUTA Cafeteria (Main)", lat: 7.3028, lng: 5.1375, radius: 25 },
  { name: "FUTA Cafeteria 2", lat: 7.3045, lng: 5.1392, radius: 25 },
  { name: "FUTA Food Court", lat: 7.3030, lng: 5.1380, radius: 25 },
  { name: "FUTA Shopping Complex", lat: 7.3032, lng: 5.1355, radius: 30 },
  { name: "FUTA Banking Area", lat: 7.3034, lng: 5.1358, radius: 25 },
  { name: "FUTA GTBank", lat: 7.3033, lng: 5.1356, radius: 15 },
  { name: "FUTA First Bank", lat: 7.3035, lng: 5.1360, radius: 15 },
  { name: "FUTA Bookshop", lat: 7.3038, lng: 5.1362, radius: 20 },
  
  // Health & Welfare
  { name: "FUTA Health Centre", lat: 7.3035, lng: 5.1340, radius: 30 },
  { name: "FUTA Counselling Centre", lat: 7.3037, lng: 5.1343, radius: 20 },
  
  // Religious Centres
  { name: "FUTA Chapel (Christian Centre)", lat: 7.3045, lng: 5.1400, radius: 30 },
  { name: "FUTA Mosque (Central Mosque)", lat: 7.3048, lng: 5.1405, radius: 30 },
  
  // Research & Innovation
  { name: "FUTA Entrepreneurship Centre", lat: 7.3065, lng: 5.1395, radius: 30 },
  { name: "FUTA STEP-B Building", lat: 7.3075, lng: 5.1375, radius: 30 },
  { name: "FUTA Research & Innovation Hub", lat: 7.3078, lng: 5.1378, radius: 30 },
  { name: "FUTA Biotechnology Centre", lat: 7.3080, lng: 5.1380, radius: 30 },
  
  // Parking & Transportation
  { name: "FUTA Car Park (Main)", lat: 7.3025, lng: 5.1350, radius: 35 },
  { name: "FUTA Car Park (Senate)", lat: 7.3038, lng: 5.1352, radius: 25 },
  { name: "FUTA Car Park (SEET)", lat: 7.3058, lng: 5.1345, radius: 25 },
  { name: "FUTA Shuttle Park", lat: 7.3048, lng: 5.1320, radius: 25 },
  
  // Hostels Area Facilities
  { name: "FUTA Hostel Cafeteria", lat: 7.3008, lng: 5.1415, radius: 20 },
  { name: "FUTA Hostel Reading Room", lat: 7.3012, lng: 5.1418, radius: 20 },
  
  // Popular Spots
  { name: "FUTA Roundabout (Main)", lat: 7.3040, lng: 5.1365, radius: 20 },
  { name: "FUTA Junction (South Gate)", lat: 7.2987, lng: 5.1376, radius: 20 },
  { name: "FUTA Freedom Park", lat: 7.3042, lng: 5.1388, radius: 25 },
  { name: "FUTA Botanical Garden", lat: 7.3055, lng: 5.1400, radius: 40 },
  { name: "FUTA Wildlife Park", lat: 7.3085, lng: 5.1410, radius: 60 },
  
  // Additional Hostel Blocks (precise block-level)
  { name: "FUTA Hall A Block 1", lat: 7.2998, lng: 5.1398, radius: 20 },
  { name: "FUTA Hall A Block 2", lat: 7.3002, lng: 5.1402, radius: 20 },
  { name: "FUTA Hall B Block 1", lat: 7.3003, lng: 5.1408, radius: 20 },
  { name: "FUTA Hall B Block 2", lat: 7.3007, lng: 5.1412, radius: 20 },
  { name: "FUTA Hall C Block 1", lat: 7.3008, lng: 5.1418, radius: 20 },
  { name: "FUTA Hall C Block 2", lat: 7.3012, lng: 5.1422, radius: 20 },
  { name: "FUTA Hall D Block 1", lat: 7.3013, lng: 5.1428, radius: 20 },
  { name: "FUTA Hall D Block 2", lat: 7.3017, lng: 5.1432, radius: 20 },
  { name: "FUTA Hall E Block 1", lat: 7.3018, lng: 5.1433, radius: 20 },
  { name: "FUTA Hall E Block 2", lat: 7.3022, lng: 5.1437, radius: 20 },
  
  // More Department Buildings (strict building detection)
  { name: "FUTA Agricultural Engineering Department", lat: 7.3023, lng: 5.1383, radius: 25 },
  { name: "FUTA Food Science Department", lat: 7.3027, lng: 5.1387, radius: 25 },
  { name: "FUTA Crop Production Department", lat: 7.3020, lng: 5.1390, radius: 25 },
  { name: "FUTA Animal Production Department", lat: 7.3022, lng: 5.1392, radius: 25 },
  { name: "FUTA Fisheries Department", lat: 7.3024, lng: 5.1395, radius: 25 },
  { name: "FUTA Forestry Department", lat: 7.3026, lng: 5.1398, radius: 25 },
  { name: "FUTA Geology Department", lat: 7.3040, lng: 5.1392, radius: 25 },
  { name: "FUTA Mining Engineering Department", lat: 7.3044, lng: 5.1395, radius: 25 },
  { name: "FUTA Meteorology Department", lat: 7.3046, lng: 5.1398, radius: 25 },
  { name: "FUTA Remote Sensing Department", lat: 7.3048, lng: 5.1392, radius: 25 },
  { name: "FUTA Cyber Security Department", lat: 7.3056, lng: 5.1385, radius: 25 },
  { name: "FUTA Information Technology Department", lat: 7.3050, lng: 5.1376, radius: 25 },
  { name: "FUTA Statistics Department", lat: 7.3024, lng: 5.1356, radius: 25 },
  { name: "FUTA Project Management Department", lat: 7.3033, lng: 5.1386, radius: 25 },
  { name: "FUTA Entrepreneurship Department", lat: 7.3036, lng: 5.1390, radius: 25 },
  { name: "FUTA Biomedical Technology Department", lat: 7.3050, lng: 5.1398, radius: 25 },
  { name: "FUTA Environmental Health Department", lat: 7.3046, lng: 5.1393, radius: 25 },
  
  // Laboratories & Workshops (precise room-level)
  { name: "FUTA Engineering Workshop", lat: 7.3064, lng: 5.1348, radius: 25 },
  { name: "FUTA Physics Laboratory", lat: 7.3029, lng: 5.1364, radius: 20 },
  { name: "FUTA Chemistry Laboratory", lat: 7.3031, lng: 5.1366, radius: 20 },
  { name: "FUTA Biology Laboratory", lat: 7.3032, lng: 5.1371, radius: 20 },
  { name: "FUTA Computer Laboratory", lat: 7.3053, lng: 5.1383, radius: 20 },
  { name: "FUTA Agricultural Workshop", lat: 7.3022, lng: 5.1380, radius: 20 },
  { name: "FUTA Drawing Studio", lat: 7.3071, lng: 5.1346, radius: 20 },
  
  // Staff Quarters
  { name: "FUTA Staff Quarters (Zone A)", lat: 7.3090, lng: 5.1350, radius: 40 },
  { name: "FUTA Staff Quarters (Zone B)", lat: 7.3095, lng: 5.1360, radius: 40 },
  { name: "FUTA Staff Quarters (Zone C)", lat: 7.3100, lng: 5.1370, radius: 40 },
  { name: "FUTA VC Lodge", lat: 7.3098, lng: 5.1355, radius: 25 },
  
  // Student Hangout Spots (small precise areas)
  { name: "FUTA Night Class Area", lat: 7.3046, lng: 5.1370, radius: 20 },
  { name: "FUTA Gazebo (SAAT)", lat: 7.3024, lng: 5.1382, radius: 15 },
  { name: "FUTA Gazebo (SEET)", lat: 7.3061, lng: 5.1352, radius: 15 },
  { name: "FUTA Gazebo (SOS)", lat: 7.3031, lng: 5.1367, radius: 15 },
  { name: "FUTA Under Tree (Popular)", lat: 7.3038, lng: 5.1370, radius: 15 },
  { name: "FUTA Buka Junction", lat: 7.3029, lng: 5.1378, radius: 20 },
  { name: "FUTA Mama Put Area", lat: 7.3031, lng: 5.1382, radius: 20 },
  
  // Water & Utilities (small structures)
  { name: "FUTA Borehole (Main)", lat: 7.3035, lng: 5.1338, radius: 15 },
  { name: "FUTA Water Tank", lat: 7.3037, lng: 5.1340, radius: 15 },
  { name: "FUTA Generator House", lat: 7.3039, lng: 5.1342, radius: 15 },
  { name: "FUTA Power Station", lat: 7.3041, lng: 5.1335, radius: 20 },
  
  // Security Posts (very precise)
  { name: "FUTA Security Post (South Gate)", lat: 7.2986, lng: 5.1377, radius: 10 },
  { name: "FUTA Security Post (North Gate)", lat: 7.3104, lng: 5.1364, radius: 10 },
  { name: "FUTA Security Post (Main Gate)", lat: 7.3033, lng: 5.1319, radius: 10 },
  { name: "FUTA Security Office", lat: 7.3035, lng: 5.1335, radius: 15 },
  
  // ATM Points (very precise)
  { name: "FUTA ATM (GTBank)", lat: 7.3032, lng: 5.1355, radius: 8 },
  { name: "FUTA ATM (First Bank)", lat: 7.3034, lng: 5.1359, radius: 8 },
  { name: "FUTA ATM (Hostel Area)", lat: 7.3006, lng: 5.1412, radius: 8 },
  
  // Printing & Business Centres
  { name: "FUTA Business Centre (Main)", lat: 7.3036, lng: 5.1364, radius: 15 },
  { name: "FUTA Printing Press", lat: 7.3038, lng: 5.1366, radius: 15 },
  { name: "FUTA Photocopy Centre", lat: 7.3040, lng: 5.1368, radius: 15 },
  
  // Exam Halls
  { name: "FUTA CBT Centre", lat: 7.3055, lng: 5.1375, radius: 25 },
  { name: "FUTA Exam Hall (SEET)", lat: 7.3062, lng: 5.1354, radius: 25 },
  { name: "FUTA Exam Hall (SOS)", lat: 7.3029, lng: 5.1363, radius: 25 },
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

// Get FUTA-specific location name based on coordinates (STRICT mode - exact building only)
export function getFUTALocationName(lat: number, lng: number): string | null {
  if (!isWithinFUTA(lat, lng)) {
    return null; // Not within FUTA campus
  }
  
  const { landmark, distance } = findNearestLandmark(lat, lng);
  
  // STRICT: Only return exact building match - must be within the landmark's radius
  if (landmark && distance <= landmark.radius) {
    return landmark.name;
  }
  
  // No exact match found - return null to trigger fallback to reverse geocoding
  return null;
}

// Get FUTA location with fallback options (for cases where you want "Near X" behavior)
export function getFUTALocationNameWithFallback(lat: number, lng: number): string | null {
  if (!isWithinFUTA(lat, lng)) {
    return null;
  }
  
  const { landmark, distance } = findNearestLandmark(lat, lng);
  
  if (landmark && distance <= landmark.radius) {
    return landmark.name;
  }
  
  // Fallback: If within FUTA but not at exact building
  if (landmark && distance <= 150) {
    return `Near ${landmark.name}`;
  }
  
  return "FUTA Campus";
}
