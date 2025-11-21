import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

/**
 * Banner component that shows when the user is offline
 * Displays at the top of the page with a slide-down animation
 */
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }

    if (isOnline && wasOffline) {
      // Show "reconnected" message briefly
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Don't show anything if online and never was offline
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <Alert className="rounded-none border-x-0 border-t-0 bg-destructive text-destructive-foreground shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="font-medium">
              No internet connection. Some features may be unavailable.
            </span>
            <span className="text-xs opacity-80">
              Changes will be saved when connection is restored
            </span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="rounded-none border-x-0 border-t-0 bg-green-600 text-white shadow-lg animate-in slide-in-from-top duration-300">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Connection restored. Syncing data...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
