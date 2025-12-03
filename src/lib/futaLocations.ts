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
  { name: "FUTA Main Gate (Obanla Gate)", lat: 7.3034, lng: 5.1320, radius: 100 },
  { name: "FUTA ABUAD Gate", lat: 7.3080, lng: 5.1420, radius: 100 },
  
  // Lecture Theatres
  { name: "FUTA Main Lecture Theatre (MLT)", lat: 7.3045, lng: 5.1368, radius: 80 },
  { name: "FUTA Little Lecture Theatre (LLT)", lat: 7.3038, lng: 5.1372, radius: 80 },
  { name: "FUTA 500 Capacity Lecture Theatre", lat: 7.3050, lng: 5.1362, radius: 80 },
  { name: "FUTA ETF Lecture Theatre", lat: 7.3055, lng: 5.1358, radius: 80 },
  
  // Administrative Buildings
  { name: "FUTA Senate Building", lat: 7.3040, lng: 5.1355, radius: 80 },
  { name: "FUTA Administrative Block", lat: 7.3038, lng: 5.1348, radius: 80 },
  { name: "FUTA Vice Chancellor's Office", lat: 7.3042, lng: 5.1350, radius: 60 },
  { name: "FUTA Registry", lat: 7.3036, lng: 5.1345, radius: 60 },
  { name: "FUTA Bursary", lat: 7.3034, lng: 5.1342, radius: 60 },
  
  // Schools/Faculties
  { name: "FUTA SEET (School of Engineering)", lat: 7.3060, lng: 5.1350, radius: 100 },
  { name: "FUTA SAAT (School of Agriculture)", lat: 7.3025, lng: 5.1385, radius: 100 },
  { name: "FUTA SOS (School of Sciences)", lat: 7.3030, lng: 5.1365, radius: 100 },
  { name: "FUTA SEMS (School of Earth & Mineral Sciences)", lat: 7.3042, lng: 5.1390, radius: 100 },
  { name: "FUTA SICT (School of Computing)", lat: 7.3052, lng: 5.1380, radius: 100 },
  { name: "FUTA SOHT (School of Health Tech)", lat: 7.3048, lng: 5.1395, radius: 100 },
  { name: "FUTA SOMT (School of Management Tech)", lat: 7.3035, lng: 5.1388, radius: 100 },
  
  // Department Buildings
  { name: "FUTA Computer Science Department", lat: 7.3054, lng: 5.1382, radius: 60 },
  { name: "FUTA Electrical Engineering Department", lat: 7.3062, lng: 5.1355, radius: 60 },
  { name: "FUTA Mechanical Engineering Department", lat: 7.3058, lng: 5.1348, radius: 60 },
  { name: "FUTA Civil Engineering Department", lat: 7.3065, lng: 5.1352, radius: 60 },
  { name: "FUTA Chemical Engineering Department", lat: 7.3068, lng: 5.1358, radius: 60 },
  { name: "FUTA Physics Department", lat: 7.3028, lng: 5.1362, radius: 60 },
  { name: "FUTA Chemistry Department", lat: 7.3032, lng: 5.1368, radius: 60 },
  { name: "FUTA Mathematics Department", lat: 7.3026, lng: 5.1358, radius: 60 },
  { name: "FUTA Biology Department", lat: 7.3030, lng: 5.1370, radius: 60 },
  { name: "FUTA Biochemistry Department", lat: 7.3033, lng: 5.1372, radius: 60 },
  { name: "FUTA Microbiology Department", lat: 7.3035, lng: 5.1375, radius: 60 },
  { name: "FUTA Architecture Department", lat: 7.3070, lng: 5.1345, radius: 60 },
  { name: "FUTA Industrial Design Department", lat: 7.3072, lng: 5.1348, radius: 60 },
  
  // Hostels - Male
  { name: "FUTA Hall A (Joseph Ayo Babalola Hall)", lat: 7.3000, lng: 5.1400, radius: 100 },
  { name: "FUTA Hall B (Obafemi Awolowo Hall)", lat: 7.3005, lng: 5.1410, radius: 100 },
  { name: "FUTA Hall C (Wole Soyinka Hall)", lat: 7.3010, lng: 5.1420, radius: 100 },
  { name: "FUTA Hall D (Ahmadu Bello Hall)", lat: 7.3015, lng: 5.1430, radius: 100 },
  { name: "FUTA Hall E (Nnamdi Azikiwe Hall)", lat: 7.3020, lng: 5.1435, radius: 100 },
  { name: "FUTA PG Hostel (Male)", lat: 7.3022, lng: 5.1440, radius: 100 },
  
  // Hostels - Female
  { name: "FUTA Female Hostel (Queen Amina Hall)", lat: 7.2995, lng: 5.1395, radius: 100 },
  { name: "FUTA Female Hostel (Queen Moremi Hall)", lat: 7.2992, lng: 5.1400, radius: 100 },
  { name: "FUTA Female Hostel (Funmilayo Hall)", lat: 7.2990, lng: 5.1405, radius: 100 },
  { name: "FUTA PG Hostel (Female)", lat: 7.2988, lng: 5.1408, radius: 100 },
  
  // Libraries & Learning Centres
  { name: "FUTA Main Library", lat: 7.3048, lng: 5.1360, radius: 80 },
  { name: "FUTA ICT Centre", lat: 7.3052, lng: 5.1378, radius: 80 },
  { name: "FUTA e-Library", lat: 7.3050, lng: 5.1365, radius: 60 },
  
  // Sports & Recreation
  { name: "FUTA Sports Complex", lat: 7.3070, lng: 5.1335, radius: 120 },
  { name: "FUTA Football Field", lat: 7.3068, lng: 5.1330, radius: 100 },
  { name: "FUTA Basketball Court", lat: 7.3072, lng: 5.1340, radius: 60 },
  { name: "FUTA Tennis Court", lat: 7.3074, lng: 5.1338, radius: 50 },
  { name: "FUTA Swimming Pool", lat: 7.3076, lng: 5.1342, radius: 50 },
  { name: "FUTA Student Union Building (SUB)", lat: 7.3040, lng: 5.1385, radius: 80 },
  
  // Food & Commercial Areas
  { name: "FUTA Cafeteria (Main)", lat: 7.3028, lng: 5.1375, radius: 60 },
  { name: "FUTA Cafeteria 2", lat: 7.3045, lng: 5.1392, radius: 60 },
  { name: "FUTA Food Court", lat: 7.3030, lng: 5.1380, radius: 60 },
  { name: "FUTA Shopping Complex", lat: 7.3032, lng: 5.1355, radius: 80 },
  { name: "FUTA Banking Area", lat: 7.3034, lng: 5.1358, radius: 60 },
  { name: "FUTA GTBank", lat: 7.3033, lng: 5.1356, radius: 40 },
  { name: "FUTA First Bank", lat: 7.3035, lng: 5.1360, radius: 40 },
  { name: "FUTA Bookshop", lat: 7.3038, lng: 5.1362, radius: 50 },
  
  // Health & Welfare
  { name: "FUTA Health Centre", lat: 7.3035, lng: 5.1340, radius: 80 },
  { name: "FUTA Counselling Centre", lat: 7.3037, lng: 5.1343, radius: 50 },
  
  // Religious Centres
  { name: "FUTA Chapel (Christian Centre)", lat: 7.3045, lng: 5.1400, radius: 80 },
  { name: "FUTA Mosque (Central Mosque)", lat: 7.3048, lng: 5.1405, radius: 80 },
  
  // Research & Innovation
  { name: "FUTA Entrepreneurship Centre", lat: 7.3065, lng: 5.1395, radius: 80 },
  { name: "FUTA STEP-B Building", lat: 7.3075, lng: 5.1375, radius: 80 },
  { name: "FUTA Research & Innovation Hub", lat: 7.3078, lng: 5.1378, radius: 80 },
  { name: "FUTA Biotechnology Centre", lat: 7.3080, lng: 5.1380, radius: 80 },
  
  // Parking & Transportation
  { name: "FUTA Car Park (Main)", lat: 7.3025, lng: 5.1350, radius: 80 },
  { name: "FUTA Car Park (Senate)", lat: 7.3038, lng: 5.1352, radius: 60 },
  { name: "FUTA Car Park (SEET)", lat: 7.3058, lng: 5.1345, radius: 60 },
  { name: "FUTA Shuttle Park", lat: 7.2988, lng: 5.1380, radius: 60 },
  
  // Hostels Area Facilities
  { name: "FUTA Hostel Cafeteria", lat: 7.3008, lng: 5.1415, radius: 50 },
  { name: "FUTA Hostel Reading Room", lat: 7.3012, lng: 5.1418, radius: 50 },
  
  // Popular Spots
  { name: "FUTA Roundabout (Main)", lat: 7.3040, lng: 5.1365, radius: 50 },
  { name: "FUTA Junction (South Gate)", lat: 7.2987, lng: 5.1376, radius: 50 },
  { name: "FUTA Freedom Park", lat: 7.3042, lng: 5.1388, radius: 60 },
  { name: "FUTA Botanical Garden", lat: 7.3055, lng: 5.1400, radius: 100 },
  { name: "FUTA Wildlife Park", lat: 7.3085, lng: 5.1410, radius: 150 },
  
  // Additional Hostel Blocks
  { name: "FUTA Hall A Block 1", lat: 7.2998, lng: 5.1398, radius: 40 },
  { name: "FUTA Hall A Block 2", lat: 7.3002, lng: 5.1402, radius: 40 },
  { name: "FUTA Hall B Block 1", lat: 7.3003, lng: 5.1408, radius: 40 },
  { name: "FUTA Hall B Block 2", lat: 7.3007, lng: 5.1412, radius: 40 },
  { name: "FUTA Hall C Block 1", lat: 7.3008, lng: 5.1418, radius: 40 },
  { name: "FUTA Hall C Block 2", lat: 7.3012, lng: 5.1422, radius: 40 },
  { name: "FUTA Hall D Block 1", lat: 7.3013, lng: 5.1428, radius: 40 },
  { name: "FUTA Hall D Block 2", lat: 7.3017, lng: 5.1432, radius: 40 },
  { name: "FUTA Hall E Block 1", lat: 7.3018, lng: 5.1433, radius: 40 },
  { name: "FUTA Hall E Block 2", lat: 7.3022, lng: 5.1437, radius: 40 },
  
  // More Department Buildings
  { name: "FUTA Agricultural Engineering Department", lat: 7.3023, lng: 5.1383, radius: 60 },
  { name: "FUTA Food Science Department", lat: 7.3027, lng: 5.1387, radius: 60 },
  { name: "FUTA Crop Production Department", lat: 7.3020, lng: 5.1390, radius: 60 },
  { name: "FUTA Animal Production Department", lat: 7.3022, lng: 5.1392, radius: 60 },
  { name: "FUTA Fisheries Department", lat: 7.3024, lng: 5.1395, radius: 60 },
  { name: "FUTA Forestry Department", lat: 7.3026, lng: 5.1398, radius: 60 },
  { name: "FUTA Geology Department", lat: 7.3040, lng: 5.1392, radius: 60 },
  { name: "FUTA Mining Engineering Department", lat: 7.3044, lng: 5.1395, radius: 60 },
  { name: "FUTA Meteorology Department", lat: 7.3046, lng: 5.1398, radius: 60 },
  { name: "FUTA Remote Sensing Department", lat: 7.3048, lng: 5.1392, radius: 60 },
  { name: "FUTA Cyber Security Department", lat: 7.3056, lng: 5.1385, radius: 60 },
  { name: "FUTA Information Technology Department", lat: 7.3050, lng: 5.1376, radius: 60 },
  { name: "FUTA Statistics Department", lat: 7.3024, lng: 5.1356, radius: 60 },
  { name: "FUTA Project Management Department", lat: 7.3033, lng: 5.1386, radius: 60 },
  { name: "FUTA Entrepreneurship Department", lat: 7.3036, lng: 5.1390, radius: 60 },
  { name: "FUTA Biomedical Technology Department", lat: 7.3050, lng: 5.1398, radius: 60 },
  { name: "FUTA Environmental Health Department", lat: 7.3046, lng: 5.1393, radius: 60 },
  
  // Laboratories & Workshops
  { name: "FUTA Engineering Workshop", lat: 7.3064, lng: 5.1348, radius: 60 },
  { name: "FUTA Physics Laboratory", lat: 7.3029, lng: 5.1364, radius: 50 },
  { name: "FUTA Chemistry Laboratory", lat: 7.3031, lng: 5.1366, radius: 50 },
  { name: "FUTA Biology Laboratory", lat: 7.3032, lng: 5.1371, radius: 50 },
  { name: "FUTA Computer Laboratory", lat: 7.3053, lng: 5.1383, radius: 50 },
  { name: "FUTA Agricultural Workshop", lat: 7.3022, lng: 5.1380, radius: 50 },
  { name: "FUTA Drawing Studio", lat: 7.3071, lng: 5.1346, radius: 50 },
  
  // Staff Quarters
  { name: "FUTA Staff Quarters (Zone A)", lat: 7.3090, lng: 5.1350, radius: 100 },
  { name: "FUTA Staff Quarters (Zone B)", lat: 7.3095, lng: 5.1360, radius: 100 },
  { name: "FUTA Staff Quarters (Zone C)", lat: 7.3100, lng: 5.1370, radius: 100 },
  { name: "FUTA VC Lodge", lat: 7.3098, lng: 5.1355, radius: 60 },
  
  // Student Hangout Spots
  { name: "FUTA Night Class Area", lat: 7.3046, lng: 5.1370, radius: 50 },
  { name: "FUTA Gazebo (SAAT)", lat: 7.3024, lng: 5.1382, radius: 40 },
  { name: "FUTA Gazebo (SEET)", lat: 7.3061, lng: 5.1352, radius: 40 },
  { name: "FUTA Gazebo (SOS)", lat: 7.3031, lng: 5.1367, radius: 40 },
  { name: "FUTA Under Tree (Popular)", lat: 7.3038, lng: 5.1370, radius: 40 },
  { name: "FUTA Buka Junction", lat: 7.3029, lng: 5.1378, radius: 50 },
  { name: "FUTA Mama Put Area", lat: 7.3031, lng: 5.1382, radius: 50 },
  
  // Water & Utilities
  { name: "FUTA Borehole (Main)", lat: 7.3035, lng: 5.1338, radius: 40 },
  { name: "FUTA Water Tank", lat: 7.3037, lng: 5.1340, radius: 40 },
  { name: "FUTA Generator House", lat: 7.3039, lng: 5.1342, radius: 40 },
  { name: "FUTA Power Station", lat: 7.3041, lng: 5.1335, radius: 50 },
  
  // Security Posts
  { name: "FUTA Security Post (South Gate)", lat: 7.2986, lng: 5.1377, radius: 30 },
  { name: "FUTA Security Post (North Gate)", lat: 7.3104, lng: 5.1364, radius: 30 },
  { name: "FUTA Security Post (Main Gate)", lat: 7.3033, lng: 5.1319, radius: 30 },
  { name: "FUTA Security Office", lat: 7.3035, lng: 5.1335, radius: 40 },
  
  // ATM Points
  { name: "FUTA ATM (GTBank)", lat: 7.3032, lng: 5.1355, radius: 20 },
  { name: "FUTA ATM (First Bank)", lat: 7.3034, lng: 5.1359, radius: 20 },
  { name: "FUTA ATM (Hostel Area)", lat: 7.3006, lng: 5.1412, radius: 20 },
  
  // Printing & Business Centres
  { name: "FUTA Business Centre (Main)", lat: 7.3036, lng: 5.1364, radius: 40 },
  { name: "FUTA Printing Press", lat: 7.3038, lng: 5.1366, radius: 40 },
  { name: "FUTA Photocopy Centre", lat: 7.3040, lng: 5.1368, radius: 40 },
  
  // Exam Halls
  { name: "FUTA CBT Centre", lat: 7.3055, lng: 5.1375, radius: 60 },
  { name: "FUTA Exam Hall (SEET)", lat: 7.3062, lng: 5.1354, radius: 60 },
  { name: "FUTA Exam Hall (SOS)", lat: 7.3029, lng: 5.1363, radius: 60 },
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
