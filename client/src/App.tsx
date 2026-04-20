import { Switch, Route, Link } from "wouter";
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider defaultOpen>
            <div className="min-h-screen w-full bg-[hsl(42_45%_97%)]">
              <AppSidebar />
              <div className="flex min-h-screen flex-1 flex-col md:pl-[16rem]">
                <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[hsl(146_35%_47%)]" />
                    <div>
                      <p className="font-serif text-lg font-semibold">Context: Us</p>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        Better Together
                      </p>
                    </div>
                  </div>
                  <SidebarTrigger />
                </header>
                <main className="flex-1">
                  <Router />
                </main>
              </div>
              <Link
                href="/coach"
                className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-[hsl(145_33%_48%)] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[rgba(93,138,110,0.28)] transition hover:brightness-95"
              >
                Ask AI Coach
              </Link>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
