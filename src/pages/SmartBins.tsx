import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Trash2, MapPin, Wifi, WifiOff, AlertTriangle, Radio } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SmartBinsMap, SmartBin, binColor } from "@/components/SmartBinsMap";
import { reverseGeocode } from "@/lib/reverseGeocode";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

const SmartBins = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [, setNowTick] = useState(0);
  const autoReportedRef = useRef<Set<string>>(new Set());

  // Auth + admin check
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!data) {
        toast({ title: "Access denied", description: "Admins only", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
    })();
  }, [user, authLoading, navigate]);

  // Tick to refresh "X mins ago" + online flag
  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  // Initial load + realtime
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("smart_bins")
        .select("*")
        .order("last_updated", { ascending: false });
      if (!mounted) return;
      if (error) {
        toast({ title: "Failed to load bins", description: error.message, variant: "destructive" });
      } else {
        setBins((data as SmartBin[]) || []);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("smart_bins-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "smart_bins" },
        (payload) => {
          setBins((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((b) => b.bin_id !== (payload.old as any).bin_id);
            }
            const next = payload.new as SmartBin;
            const idx = prev.findIndex((b) => b.bin_id === next.bin_id);
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // Reverse geocode addresses
  useEffect(() => {
    bins.forEach((b) => {
      if (addresses[b.bin_id]) return;
      reverseGeocode(b.latitude, b.longitude).then((addr) =>
        setAddresses((prev) => ({ ...prev, [b.bin_id]: addr }))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bins]);

  // Auto-create waste report when a bin becomes FULL
  useEffect(() => {
    if (!isAdmin || !user) return;
    bins
      .filter((b) => b.status === "FULL")
      .forEach((b) => autoCreateReportForBin(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bins, isAdmin]);

  const haversine = (a: [number, number], b: [number, number]) => {
    const R = 6371e3;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  const autoCreateReportForBin = async (bin: SmartBin) => {
    if (!user) return;
    if (autoReportedRef.current.has(bin.bin_id)) return;
    autoReportedRef.current.add(bin.bin_id);

    try {
      // Skip if an active auto-report already exists for this bin in the last 6 hours
      const sinceIso = new Date(Date.now() - 6 * 3600_000).toISOString();
      const { data: existing } = await supabase
        .from("waste_reports")
        .select("id,status")
        .like("description", `%[AUTO-BIN:${bin.bin_id}]%`)
        .gte("created_at", sinceIso)
        .in("status", ["pending", "assigned", "in_progress"])
        .limit(1);
      if (existing && existing.length > 0) return;

      // Find nearest available cleaner
      const { data: cleanerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "cleaner");
      const cleanerIds = (cleanerRoles || []).map((r) => r.user_id);

      let assignedTo: string | null = null;
      if (cleanerIds.length > 0) {
        const { data: cleaners } = await supabase
          .from("profiles")
          .select("id,location_lat,location_lng,availability_status")
          .in("id", cleanerIds)
          .eq("availability_status", "available")
          .not("location_lat", "is", null);

        let best: { id: string; d: number } | null = null;
        (cleaners || []).forEach((c: any) => {
          if (c.location_lat == null || c.location_lng == null) return;
          const d = haversine(
            [bin.latitude, bin.longitude],
            [c.location_lat, c.location_lng]
          );
          if (!best || d < best.d) best = { id: c.id, d };
        });
        assignedTo = best?.id ?? null;
      }

      const address =
        addresses[bin.bin_id] ||
        (await reverseGeocode(bin.latitude, bin.longitude));

      const { error } = await supabase.from("waste_reports").insert({
        user_id: user.id,
        image_url: "/placeholder.svg",
        location_lat: bin.latitude,
        location_lng: bin.longitude,
        location_address: address,
        waste_type: "mixed",
        severity: "high",
        status: assignedTo ? "assigned" : "pending",
        assigned_to: assignedTo,
        description: `[AUTO-BIN:${bin.bin_id}] Smart bin ${bin.bin_name || bin.bin_id} reported FULL (${bin.fill_level.toFixed(0)}%). Auto-generated pickup request.`,
      });
      if (error) {
        autoReportedRef.current.delete(bin.bin_id);
        console.error("auto-report failed", error);
      } else {
        toast({
          title: "Pickup dispatched",
          description: `Bin ${bin.bin_id} is FULL — ${assignedTo ? "assigned to nearest cleaner" : "queued (no available cleaner)"}.`,
        });
      }
    } catch (e) {
      autoReportedRef.current.delete(bin.bin_id);
      console.error(e);
    }
  };

  const enriched: SmartBin[] = useMemo(
    () =>
      bins.map((b) => {
        const age = Date.now() - new Date(b.last_updated).getTime();
        return {
          ...b,
          address: addresses[b.bin_id],
          is_online: age <= ONLINE_THRESHOLD_MS,
        };
      }),
    [bins, addresses]
  );

  const stats = useMemo(() => {
    const total = enriched.length;
    const full = enriched.filter((b) => b.status === "FULL").length;
    const online = enriched.filter((b) => b.is_online).length;
    const avg =
      total === 0
        ? 0
        : enriched.reduce((sum, b) => sum + (b.fill_level || 0), 0) / total;
    return { total, full, online, avg };
  }, [enriched]);

  const fullBins = enriched.filter((b) => b.status === "FULL");

  const handleDelete = async (binId: string) => {
    if (!confirm(`Delete bin ${binId}?`)) return;
    const { error } = await supabase.from("smart_bins").delete().eq("bin_id", binId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading smart bins…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-1" /> Admin</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" /> Smart Bins
              </h1>
              <p className="text-xs text-muted-foreground">Live IoT fill-level monitoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {fullBins.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{fullBins.length} bin{fullBins.length > 1 ? "s" : ""} FULL</AlertTitle>
            <AlertDescription>
              {fullBins.map((b) => b.bin_name || b.bin_id).join(", ")} — pickup requests auto-dispatched.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Bins" value={stats.total} />
          <StatCard label="Full" value={stats.full} accent="text-destructive" />
          <StatCard label="Online" value={stats.online} accent="text-primary" />
          <StatCard label="Avg Fill" value={`${stats.avg.toFixed(0)}%`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Live Bin Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enriched.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No smart bins reporting yet. Once your ESP32 device sends data, bins appear here automatically.
              </div>
            ) : (
              <SmartBinsMap bins={enriched} />
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((b) => (
            <Card key={b.bin_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{b.bin_name || b.bin_id}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{b.bin_id}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {b.is_online ? (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Wifi className="w-3 h-3 text-emerald-500" /> Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                        <WifiOff className="w-3 h-3" /> Offline
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium">Fill Level</span>
                    <Badge style={{ background: binColor(b.status), color: "white" }}>
                      {b.status} · {b.fill_level.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, b.fill_level))}%`,
                        background: binColor(b.status),
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">
                    {b.address || `${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Updated {formatDistanceToNow(new Date(b.last_updated), { addSuffix: true })}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(b.bin_id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number | string; accent?: string }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || ""}`}>{value}</p>
    </CardContent>
  </Card>
);

export default SmartBins;