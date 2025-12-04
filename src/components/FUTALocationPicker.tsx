import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FUTA_LANDMARKS, FUTALandmark } from "@/lib/futaLocations";

interface FUTALocationPickerProps {
  value: string;
  onSelect: (landmark: FUTALandmark) => void;
}

// Group landmarks by category
const groupedLandmarks = FUTA_LANDMARKS.reduce((acc, landmark) => {
  let category = "Other";
  const name = landmark.name.toLowerCase();
  
  if (name.includes("gate")) category = "Gates";
  else if (name.includes("lecture") || name.includes("theatre")) category = "Lecture Theatres";
  else if (name.includes("hall") || name.includes("hostel")) category = "Hostels";
  else if (name.includes("department")) category = "Departments";
  else if (name.includes("school") || name.includes("seet") || name.includes("saat") || name.includes("sos") || name.includes("sems") || name.includes("sict") || name.includes("soht") || name.includes("somt")) category = "Schools/Faculties";
  else if (name.includes("laboratory") || name.includes("workshop") || name.includes("studio")) category = "Labs & Workshops";
  else if (name.includes("library") || name.includes("ict") || name.includes("e-library")) category = "Libraries";
  else if (name.includes("cafeteria") || name.includes("food") || name.includes("buka") || name.includes("mama put")) category = "Food & Dining";
  else if (name.includes("sports") || name.includes("football") || name.includes("basketball") || name.includes("tennis") || name.includes("swimming")) category = "Sports";
  else if (name.includes("chapel") || name.includes("mosque")) category = "Religious";
  else if (name.includes("atm") || name.includes("bank")) category = "Banking";
  else if (name.includes("car park") || name.includes("shuttle")) category = "Parking";
  else if (name.includes("security")) category = "Security";
  else if (name.includes("admin") || name.includes("senate") || name.includes("registry") || name.includes("bursary") || name.includes("vc")) category = "Administration";
  
  if (!acc[category]) acc[category] = [];
  acc[category].push(landmark);
  return acc;
}, {} as Record<string, FUTALandmark[]>);

// Sort categories
const sortedCategories = [
  "Gates",
  "Schools/Faculties", 
  "Departments",
  "Lecture Theatres",
  "Hostels",
  "Libraries",
  "Labs & Workshops",
  "Administration",
  "Food & Dining",
  "Sports",
  "Religious",
  "Banking",
  "Parking",
  "Security",
  "Other"
].filter(cat => groupedLandmarks[cat]?.length > 0);

export function FUTALocationPicker({ value, onSelect }: FUTALocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return groupedLandmarks;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, FUTALandmark[]> = {};
    
    for (const [category, landmarks] of Object.entries(groupedLandmarks)) {
      const matches = landmarks.filter(l => 
        l.name.toLowerCase().includes(query)
      );
      if (matches.length > 0) {
        filtered[category] = matches;
      }
    }
    return filtered;
  }, [searchQuery]);

  const hasResults = Object.keys(filteredLandmarks).length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal h-auto min-h-10 py-2"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || "Select FUTA building manually..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search FUTA buildings..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px]">
            {!hasResults && (
              <CommandEmpty>No building found.</CommandEmpty>
            )}
            {sortedCategories.map((category) => {
              const landmarks = filteredLandmarks[category];
              if (!landmarks?.length) return null;
              
              return (
                <CommandGroup key={category} heading={category}>
                  {landmarks.map((landmark) => (
                    <CommandItem
                      key={landmark.name}
                      value={landmark.name}
                      onSelect={() => {
                        onSelect(landmark);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === landmark.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <MapPin className="mr-2 h-3 w-3 text-muted-foreground" />
                      <span className="truncate">
                        {landmark.name.replace("FUTA ", "")}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default FUTALocationPicker;
