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
        // First check if we have permission
        if ('permissions' in navigator) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            
            if (permissionStatus.state === 'denied') {
              const errorMsg = 'Location access denied. Please enable location permissions in your browser settings.';
              setError(errorMsg);
              toast.error(errorMsg, {
                duration: 5000,
                description: 'Go to browser settings → Site settings → Location to enable access'
              });
              return;
            }
          } catch (permError) {
            // Some browsers don't support permission API, continue anyway
            console.log('Permission API not available, attempting to access location directly');
          }
        }

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
            
            // Handle different error codes with user-friendly messages
            let errorMessage = 'Unable to access location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your device settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = error.message || 'Unknown location error occurred';
            }
            
            setError(errorMessage);
            toast.error(errorMessage, {
              duration: 5000,
              description: error.code === error.PERMISSION_DENIED 
                ? 'Go to browser settings → Site settings → Location to enable access'
                : undefined
            });
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
            (error) => {
              console.error('Position update error:', error);
              // Silently handle periodic update errors to avoid spamming user
              if (error.code === error.PERMISSION_DENIED) {
                // If permission is denied during update, stop tracking
                stopTracking();
              }
            }
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

