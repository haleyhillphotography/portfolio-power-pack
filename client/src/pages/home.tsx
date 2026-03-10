import { useHealth } from "@/hooks/use-health";
import { Loader2, Activity, Box } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: health, isLoading, isError } = useHealth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-md w-full space-y-12">
        
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-4">
            <Box className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-3xl font-medium text-foreground tracking-tight">
            Vite + React
          </h1>
          <p className="text-muted-foreground font-light text-sm">
            A clean, minimal starting point for your next application.
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">API Status</span>
            </div>
            
            <div className="flex items-center">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Checking</span>
                </div>
              ) : isError ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs text-destructive font-medium">Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600 font-medium capitalize">
                    {health?.status || 'Online'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-secondary/50 px-6 py-4 border-t border-border/50">
             <p className="text-xs text-muted-foreground font-mono">
               Edit client/src/pages/home.tsx to begin
             </p>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="rounded-full px-6 font-normal hover:bg-secondary transition-colors"
            onClick={() => window.open('https://react.dev', '_blank')}
          >
            Read the docs
          </Button>
        </div>

      </div>
    </div>
  );
}
