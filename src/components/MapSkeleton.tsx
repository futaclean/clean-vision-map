const MapSkeleton = () => {
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted animate-pulse">
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 mx-auto bg-muted-foreground/20 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-32 bg-muted-foreground/20 rounded mx-auto" />
            <div className="h-2 w-24 bg-muted-foreground/10 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSkeleton;
