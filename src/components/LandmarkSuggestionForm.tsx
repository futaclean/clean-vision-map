import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, MapPin } from "lucide-react";

const CATEGORIES = [
  { value: "academic", label: "Academic Building" },
  { value: "hostel", label: "Hostel" },
  { value: "admin", label: "Administrative" },
  { value: "food", label: "Food & Commercial" },
  { value: "sports", label: "Sports & Recreation" },
  { value: "library", label: "Library & Learning" },
  { value: "health", label: "Health & Welfare" },
  { value: "religious", label: "Religious Centre" },
  { value: "research", label: "Research & Innovation" },
  { value: "parking", label: "Parking & Transport" },
  { value: "utility", label: "Utilities & Services" },
  { value: "other", label: "Other" },
];

interface LandmarkSuggestionFormProps {
  currentLat?: number;
  currentLng?: number;
  onSuccess?: () => void;
}

const LandmarkSuggestionForm = ({
  currentLat,
  currentLng,
  onSuccess,
}: LandmarkSuggestionFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [lat, setLat] = useState(currentLat?.toString() || "");
  const [lng, setLng] = useState(currentLng?.toString() || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to suggest a landmark");
      return;
    }

    if (!name.trim() || !category || !lat || !lng) {
      toast.error("Please fill in all required fields");
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Invalid coordinates");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("landmark_suggestions").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        lat: latNum,
        lng: lngNum,
      });

      if (error) throw error;

      toast.success("Landmark suggestion submitted for review!");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting suggestion:", error);
      toast.error("Failed to submit suggestion");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setLat(currentLat?.toString() || "");
    setLng(currentLng?.toString() || "");
  };

  const useCurrentLocation = () => {
    if (currentLat && currentLng) {
      setLat(currentLat.toString());
      setLng(currentLng.toString());
      toast.success("Using current GPS coordinates");
    } else {
      toast.error("No GPS coordinates available");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Suggest New Landmark
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a New Landmark</DialogTitle>
          <DialogDescription>
            Can't find your building? Submit a suggestion for admin review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Landmark Name *</Label>
            <Input
              id="name"
              placeholder="e.g., FUTA New Engineering Building"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description or nearby landmarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Coordinates *</Label>
              {currentLat && currentLng && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={useCurrentLocation}
                  className="gap-1 h-auto py-1"
                >
                  <MapPin className="h-3 w-3" />
                  Use GPS
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  type="number"
                  step="any"
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  type="number"
                  step="any"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use "Use GPS" button or enter coordinates manually
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LandmarkSuggestionForm;
