import L from "leaflet";

export type LocationCategory = 
  | "gate"
  | "academic"
  | "admin"
  | "hostel"
  | "library"
  | "sports"
  | "food"
  | "health"
  | "religious"
  | "research"
  | "parking"
  | "utility"
  | "default";

// SVG marker template with customizable color
const createMarkerSvg = (color: string, strokeColor: string = "#fff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="${strokeColor}" stroke-width="1"/>
  <circle cx="12" cy="12" r="5" fill="${strokeColor}"/>
</svg>
`;

// Category colors matching design system
const categoryColors: Record<LocationCategory, { fill: string; name: string }> = {
  gate: { fill: "#6B7280", name: "Gates" },           // Gray
  academic: { fill: "#3B82F6", name: "Academic" },    // Blue
  admin: { fill: "#8B5CF6", name: "Admin" },          // Purple
  hostel: { fill: "#F59E0B", name: "Hostels" },       // Amber
  library: { fill: "#10B981", name: "Library" },      // Green
  sports: { fill: "#EF4444", name: "Sports" },        // Red
  food: { fill: "#F97316", name: "Food" },            // Orange
  health: { fill: "#EC4899", name: "Health" },        // Pink
  religious: { fill: "#6366F1", name: "Religious" },  // Indigo
  research: { fill: "#14B8A6", name: "Research" },    // Teal
  parking: { fill: "#64748B", name: "Parking" },      // Slate
  utility: { fill: "#78716C", name: "Utilities" },    // Stone
  default: { fill: "#22C55E", name: "Other" },        // Primary green
};

// Create Leaflet icon from SVG
const createIcon = (category: LocationCategory): L.DivIcon => {
  const { fill } = categoryColors[category];
  const svg = createMarkerSvg(fill);
  
  return L.divIcon({
    html: svg,
    className: "custom-marker-icon",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });
};

// Cache icons to avoid recreating
const iconCache: Partial<Record<LocationCategory, L.DivIcon>> = {};

export const getCategoryIcon = (category: LocationCategory): L.DivIcon => {
  if (!iconCache[category]) {
    iconCache[category] = createIcon(category);
  }
  return iconCache[category]!;
};

export const getCategoryFromName = (name: string): LocationCategory => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("gate")) return "gate";
  if (lowerName.includes("hall") || lowerName.includes("hostel") || lowerName.includes("block")) return "hostel";
  if (lowerName.includes("library") || lowerName.includes("ict centre") || lowerName.includes("e-library")) return "library";
  if (lowerName.includes("senate") || lowerName.includes("admin") || lowerName.includes("registry") || lowerName.includes("bursary") || lowerName.includes("vice chancellor")) return "admin";
  if (lowerName.includes("school") || lowerName.includes("seet") || lowerName.includes("saat") || lowerName.includes("sos") || lowerName.includes("sems") || lowerName.includes("sict") || lowerName.includes("soht") || lowerName.includes("somt")) return "academic";
  if (lowerName.includes("department") || lowerName.includes("laboratory") || lowerName.includes("workshop") || lowerName.includes("lecture") || lowerName.includes("cbt") || lowerName.includes("exam")) return "academic";
  if (lowerName.includes("sport") || lowerName.includes("football") || lowerName.includes("basketball") || lowerName.includes("tennis") || lowerName.includes("swimming") || lowerName.includes("sub")) return "sports";
  if (lowerName.includes("cafeteria") || lowerName.includes("food") || lowerName.includes("buka") || lowerName.includes("mama put") || lowerName.includes("shopping") || lowerName.includes("bank") || lowerName.includes("atm") || lowerName.includes("bookshop")) return "food";
  if (lowerName.includes("health") || lowerName.includes("counselling")) return "health";
  if (lowerName.includes("chapel") || lowerName.includes("mosque") || lowerName.includes("church")) return "religious";
  if (lowerName.includes("research") || lowerName.includes("entrepreneurship") || lowerName.includes("step-b") || lowerName.includes("biotech") || lowerName.includes("innovation")) return "research";
  if (lowerName.includes("car park") || lowerName.includes("shuttle") || lowerName.includes("parking")) return "parking";
  if (lowerName.includes("security") || lowerName.includes("borehole") || lowerName.includes("water tank") || lowerName.includes("generator") || lowerName.includes("power")) return "utility";
  
  return "default";
};

export const getCategoryInfo = () => categoryColors;

export const getDefaultIcon = (): L.DivIcon => getCategoryIcon("default");
