import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Sparkles } from "lucide-react";

interface ApiStatus {
  openaiConfigured: boolean;
  message: string;
}

export function ApiStatusBanner() {
  const { data: status } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  if (!status || status.openaiConfigured) {
    return null;
  }

  return (
    <div className="bg-muted border-b px-4 py-2">
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-chart-2" />
        <span className="text-muted-foreground">
          <span className="font-medium">Demo Mode:</span> AI features are showing sample responses. 
          Add your OpenAI API key for full AI-powered coaching.
        </span>
      </div>
    </div>
  );
}

export function ApiStatusBadge() {
  const { data: status } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  if (!status) {
    return null;
  }

  return (
    <Badge 
      variant={status.openaiConfigured ? "default" : "secondary"}
      className="gap-1"
    >
      {status.openaiConfigured ? (
        <>
          <Sparkles className="h-3 w-3" />
          AI Enabled
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          Demo Mode
        </>
      )}
    </Badge>
  );
}
