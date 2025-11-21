import React, { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

/**
 * Page-level error boundary with a simplified fallback UI
 * Use this for individual pages/routes rather than the entire app
 */
const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ 
  children, 
  pageName = 'this page' 
}) => {
  const handleReset = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const fallback = (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <CardTitle>Error Loading Page</CardTitle>
          </div>
          <CardDescription>
            We encountered an error while loading {pageName}. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="default" className="flex-1" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="flex-1" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            If the problem persists, try logging out and back in.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};

export default PageErrorBoundary;
