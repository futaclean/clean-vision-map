import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLocationTracking = (enabled: boolean) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setIsTracking(false);
      return;
    }

    let watchId: number | null = null;
    let updateInterval: NodeJS.Timeout | null = null;

    const startTracking = async () => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      try {
        // Request permission and start watching position
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Update location in database
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                current_lat: latitude,
                current_lng: longitude,
                location_updated_at: new Date().toISOString(),
                is_tracking_enabled: true,
              })
              .eq('id', user.id);

            if (updateError) {
              console.error('Error updating location:', updateError);
              setError('Failed to update location');
            } else {
              setIsTracking(true);
              setError(null);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setError(error.message);
            toast.error(`Location error: ${error.message}`);
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );

        // Also update every 30 seconds to keep connection alive
        updateInterval = setInterval(async () => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              await supabase
                .from('profiles')
                .update({
                  current_lat: latitude,
                  current_lng: longitude,
                  location_updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            },
            (error) => console.error('Position update error:', error)
          );
        }, 30000);

      } catch (err) {
        console.error('Error starting location tracking:', err);
        setError('Failed to start tracking');
      }
    };

    const stopTracking = async () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (updateInterval) {
        clearInterval(updateInterval);
      }

      // Disable tracking in database
      await supabase
        .from('profiles')
        .update({
          is_tracking_enabled: false,
        })
        .eq('id', user.id);

      setIsTracking(false);
    };

    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [user, enabled]);

  return { isTracking, error };
};

