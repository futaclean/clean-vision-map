import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, MapPin, Upload, ArrowLeft, Loader2, Leaf } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LocationMap from "@/components/LocationMap";
import MapSkeleton from "@/components/MapSkeleton";
import SubmissionProgress from "@/components/SubmissionProgress";
import Confetti from "@/components/Confetti";
import FUTALocationPicker from "@/components/FUTALocationPicker";
import WasteScannerOverlay from "@/components/WasteScannerOverlay";
import { VALID_WASTE_TYPES, isValidWasteType } from "@/lib/constants";
import { hapticSuccess, hapticError, hapticLight, hapticMedium } from "@/lib/haptics";
import { getFUTALocationName, FUTALandmark } from "@/lib/futaLocations";

const ReportWaste = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [description, setDescription] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'location' | 'uploading' | 'saving' | 'complete' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Auto-capture GPS on component mount
    captureLocation();
  }, []);

  const getLocationAddress = async (lat: number, lng: number) => {
    try {
      console.log('Getting location address for:', lat, lng);
      
      // First, check if we're near a known FUTA landmark
      const futaLocation = getFUTALocationName(lat, lng);
      if (futaLocation) {
        console.log('FUTA landmark found:', futaLocation);
        return futaLocation;
      }
      
      // Fallback to OpenStreetMap Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CleanFUTA-Waste-Management-App'
          }
        }
      );
      
      console.log('Geocoding response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Geocoding data received:', data);
      
      // Format a readable address from the response
      const addr = data.address || {};
      const parts = [];
      
      if (addr.building) parts.push(addr.building);
      if (addr.road) parts.push(addr.road);
      if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
      if (addr.university) parts.push(addr.university);
      if (addr.city || addr.town) parts.push(addr.city || addr.town);
      
      const address = parts.length > 0 
        ? parts.join(', ')
        : data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      console.log('Final address:', address);
      return address;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const captureLocation = () => {
    setGettingLocation(true);
    console.log('Capturing location...');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('GPS coordinates obtained:', latitude, longitude);
          
          setLocation({ lat: latitude, lng: longitude });
          
          // Show coordinates immediately as a placeholder
          setLocationAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          
          toast({
            title: "Getting address...",
            description: "Converting GPS to readable address",
          });
          
          // Fetch the readable address in the background (prioritizes FUTA landmarks)
          const address = await getLocationAddress(latitude, longitude);
          setLocationAddress(address);
          
          setGettingLocation(false);
          
          // Haptic feedback for successful location capture
          hapticMedium();
          
          toast({
            title: "Location captured",
            description: "Address obtained successfully",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setGettingLocation(false);
          toast({
            title: "Location error",
            description: `Could not get your location: ${error.message}`,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setGettingLocation(false);
      console.error('Geolocation not supported');
      toast({
        title: "GPS not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or WebP image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Image must be under 10MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      toast({
        title: "Image required",
        description: "Please upload an image of the waste",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Location required",
        description: "Please enable GPS to capture your location",
        variant: "destructive",
      });
      return;
    }

    if (!wasteType) {
      toast({
        title: "Waste type required",
        description: "Please select a waste category",
        variant: "destructive",
      });
      return;
    }

    // Validate waste type
    if (!isValidWasteType(wasteType)) {
      toast({
        title: "Invalid waste type",
        description: "Please select a valid waste category",
        variant: "destructive",
      });
      return;
    }

    // Validate description length (1000 character limit)
    if (description && description.length > 1000) {
      toast({
        title: "Description too long",
        description: "Description must be under 1000 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate GPS coordinates (reasonable ranges for Nigeria/FUTA area)
    // FUTA is approximately at 7.3°N, 5.1°E
    // Allow reasonable bounds for Nigeria: Lat 4-14°N, Lng 2.5-15°E
    if (location.lat < 4 || location.lat > 14 || location.lng < 2.5 || location.lng > 15) {
      toast({
        title: "Invalid location",
        description: "GPS coordinates appear to be outside the valid range",
        variant: "destructive",
      });
      return;
    }

    // Re-validate file before upload (defense in depth)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type.toLowerCase())) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    // Start scanning animation
    setIsScanning(true);
  };

  const handleScanVerified = async (suggestedWasteType?: string, wasteDescription?: string) => {
    // Auto-fill waste type if suggested by AI
    if (suggestedWasteType && isValidWasteType(suggestedWasteType)) {
      setWasteType(suggestedWasteType);
      hapticLight();
      toast({
        title: "Waste type detected",
        description: `AI detected: ${suggestedWasteType.charAt(0).toUpperCase() + suggestedWasteType.slice(1)} waste`,
      });
    }

    // Continue with actual submission after successful scan
    setIsScanning(false);
    setLoading(true);

    try {
      // Step 1: Uploading image
      setSubmissionStep('uploading');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      const fileExt = imageFile.type.split('/')[1];
      const sanitizedExt = fileExt === 'jpeg' ? 'jpg' : fileExt;
      const fileName = `${user!.id}/${Date.now()}.${sanitizedExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('waste-reports')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('waste-reports')
        .getPublicUrl(fileName);

      // Step 2: Saving report
      setSubmissionStep('saving');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      const { error } = await supabase
        .from("waste_reports")
        .insert({
          user_id: user!.id,
          image_url: publicUrl,
          location_lat: location.lat,
          location_lng: location.lng,
          location_address: locationAddress,
          waste_type: wasteType,
          description: description ? description.trim() : null,
          status: "pending",
        });

      if (error) throw error;

      // Step 3: Complete
      setSubmissionStep('complete');
      
      // Trigger confetti and haptic feedback
      setShowConfetti(true);
      hapticSuccess();
      
      toast({
        title: "Report submitted successfully",
        description: "Thank you for helping keep FUTA clean!",
      });

      // Reset form
      setImageFile(null);
      setImagePreview("");
      setWasteType("");
      setDescription("");
      
      // Redirect to dashboard after showing success
      setTimeout(() => {
        setSubmissionStep(null);
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      setSubmissionStep(null);
      
      // Trigger error haptic feedback
      hapticError();
      
      toast({
        title: "Error submitting report",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Confetti Animation */}
      <Confetti active={showConfetti} />
      
      {/* Waste Scanner Overlay */}
      <WasteScannerOverlay
        imageUrl={imagePreview}
        isScanning={isScanning}
        onVerified={handleScanVerified}
        onRejected={(reason) => {
          setIsScanning(false);
          hapticError();
          toast({
            title: "Image not accepted",
            description: reason || "Please upload a clear image of waste",
            variant: "destructive",
          });
        }}
      />
      
      {/* Submission Progress Overlay */}
      <SubmissionProgress currentStep={submissionStep} />
      
      {/* Header */}
      <header className="bg-gradient-primary border-b border-border/50 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full p-2">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:inline">CleanFUTA</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Report Waste
          </h1>
          <p className="text-muted-foreground text-lg">
            Help keep our campus clean by reporting waste issues
          </p>
        </div>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Waste Report Form</CardTitle>
            <CardDescription>
              Fill in the details below to submit your waste report
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Waste Image *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Waste preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                      
                      {/* Camera and Upload Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {/* Direct Camera Capture - Primary on mobile */}
                        <label htmlFor="camera-capture" className="cursor-pointer">
                          <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg">
                            <Camera className="h-5 w-5" />
                            Take Photo
                          </div>
                          <input
                            id="camera-capture"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                        
                        {/* File Upload - Secondary option */}
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <div className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-input bg-background rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                            <Upload className="h-5 w-5" />
                            Upload Image
                          </div>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        JPEG, PNG, or WebP • Max 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location-address">GPS Location *</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="location-address"
                      type="text"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Location not captured"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      hapticLight();
                      captureLocation();
                    }}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Manual FUTA Location Picker */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    GPS not accurate? Select your exact building:
                  </p>
                  <FUTALocationPicker 
                    value={locationAddress}
                    currentLat={location?.lat}
                    currentLng={location?.lng}
                    onSelect={(landmark: FUTALandmark) => {
                      setLocation({ lat: landmark.lat, lng: landmark.lng });
                      setLocationAddress(landmark.name);
                      hapticMedium();
                      toast({
                        title: "Location updated",
                        description: `Set to ${landmark.name}`,
                      });
                    }}
                  />
                </div>
                
                <div className="mt-4">
                  {location ? (
                    <LocationMap 
                      lat={location.lat} 
                      lng={location.lng} 
                      address={locationAddress}
                    />
                  ) : (
                    <MapSkeleton />
                  )}
                </div>
              </div>

              {/* Waste Type */}
              <div className="space-y-2">
                <Label htmlFor="waste-type">Waste Category *</Label>
                <Select value={wasteType} onValueChange={(value) => {
                  setWasteType(value);
                  hapticLight();
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_WASTE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details about the waste..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/1000 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReportWaste;
