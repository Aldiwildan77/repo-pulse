import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/utils/constants";

interface ServiceStatus {
  status: "up" | "down";
  latencyMs: number;
}

interface HealthData {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
  };
}

const STATUS_LABELS: Record<HealthData["status"], string> = {
  healthy: "All Systems Operational",
  degraded: "Partial Outage",
  unhealthy: "Major Outage",
};

const STATUS_VARIANTS: Record<HealthData["status"], "default" | "secondary" | "destructive"> = {
  healthy: "default",
  degraded: "secondary",
  unhealthy: "destructive",
};

function ServiceCard({ name, service }: { name: string; service: ServiceStatus }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          {name}
          <Badge variant={service.status === "up" ? "default" : "destructive"}>
            {service.status === "up" ? "Operational" : "Down"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Latency: {service.latencyMs}ms
        </p>
      </CardContent>
    </Card>
  );
}

export function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      const data: HealthData = await res.json();
      setHealth(data);
      setError(null);
    } catch {
      setError("Unable to reach the API server.");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Status</h1>
        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="mb-6">
          <CardContent className="py-6 text-center">
            <Badge variant="destructive">Unreachable</Badge>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {health && (
        <>
          <Card className="mb-6">
            <CardContent className="flex items-center justify-between py-6">
              <span className="font-medium">{STATUS_LABELS[health.status]}</span>
              <Badge variant={STATUS_VARIANTS[health.status]}>
                {health.status}
              </Badge>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <ServiceCard name="Database" service={health.services.database} />
            <ServiceCard name="Redis" service={health.services.redis} />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        </>
      )}

      <div className="mt-8 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
