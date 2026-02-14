import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Scan, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="hero-glow w-[400px] h-[400px] top-1/4 left-1/4 opacity-10" />
      
      <div className="relative z-10 text-center px-4">
        <div className="w-16 h-16 neon-border rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Scan className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-7xl font-display font-bold text-foreground mb-2">404</h1>
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">Route Not Found</p>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="shadow-button font-semibold">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
