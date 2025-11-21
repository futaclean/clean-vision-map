import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  logError?: boolean;
}

/**
 * Custom hook for consistent error handling across the application
 */
export const useErrorHandler = () => {
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'Error',
      logError = true,
    } = options;

    // Log error to console
    if (logError) {
      console.error('Error:', error);
    }

    // Extract error message
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    // Show toast notification
    if (showToast) {
      toast({
        title: toastTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    }

    return errorMessage;
  }, []);

  return { handleError };
};
