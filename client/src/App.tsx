import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/app-sidebar";
import { queryClient } from "@/lib/queryClient";
import DashboardPage from "@/pages/dashboard";
import ProfilesPage from "@/pages/profiles";
import QuestionnairePage from "@/pages/questionnaire";
import CoachPage from "@/pages/coach";
import InsightsPage from "@/pages/insights";
import CheckInPage from "@/pages/check-in";
import ToolsPage from "@/pages/tools";
import TriggersPage from "@/pages/triggers";
import RepairPage from "@/pages/repair";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/profiles" component={ProfilesPage} />
      <Route path="/questionnaire" component={QuestionnairePage} />
      <Route path="/coach" component={CoachPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route path="/check-in" component={CheckInPage} />
      <Route path="/tools" component={ToolsPage} />
      <Route path="/triggers" component={TriggersPage} />
      <Route path="/repair" component={RepairPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex min-h-screen flex-1 flex-col md:pl-[17rem]">
                <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                      <p className="font-medium">RelateIQ</p>
                      <p className="text-xs text-muted-foreground">
                        Base44-free rebuild on GitHub + Cloudflare
                      </p>
                    </div>
                  </div>
                </header>
                <main className="flex-1">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
