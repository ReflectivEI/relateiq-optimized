import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  MessageCircleHeart,
  BarChart3,
  CalendarCheck,
  Sparkles,
  Menu,
  X,
  Heart,
  Zap,
  HeartHandshake,
  LogOut,
  MessagesSquare,
  BrainCircuit,
  Library,
  BookOpen,
  TrendingUp,
  Sunrise,
  BookMarked,
  Stars,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import PageBanner from "@/components/layout/PageBanner";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/journal", label: "Journal", icon: BookMarked },
  { path: "/health-report", label: "Health Report", icon: Activity },
  { path: "/vision", label: "Vision Board", icon: Stars },
  { path: "/playbook", label: "Playbook", icon: BookOpen },
  { path: "/profiles", label: "Profiles", icon: User },
  { path: "/questionnaire", label: "Questionnaire", icon: MessageCircleHeart },
  { path: "/analysis", label: "Analysis Engine", icon: BrainCircuit },
  { path: "/roadmap", label: "Growth Roadmap", icon: TrendingUp },
  { path: "/daily", label: "Daily Connections", icon: Sunrise },
  { path: "/insight-library", label: "Insight Library", icon: Library },
  { path: "/knowledge", label: "Knowledge Hub", icon: BookOpen },
  { path: "/coach", label: "AI Coach", icon: Sparkles },
  { path: "/insights", label: "Insights", icon: BarChart3 },
  { path: "/check-in", label: "Check-In", icon: CalendarCheck },
  { path: "/tools", label: "Smart Tools", icon: Heart },
  { path: "/triggers", label: "Triggers", icon: Zap },
  { path: "/repair", label: "Proactive Repair", icon: HeartHandshake },
  { path: "/chat", label: "Relationship Chat", icon: MessagesSquare },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar fixed h-full z-30">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">Context: Us</h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Better Together</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => api.auth.logout()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all mb-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            This app provides guidance based on behavioral patterns. It is not a substitute for licensed therapy.
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            <span className="font-display font-semibold text-foreground">Context: Us</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="px-4 pb-4 space-y-1 bg-card border-b border-border">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        {/* Top bar with theme toggle */}
        <div className="hidden lg:flex items-center justify-end px-8 pt-4 pb-0">
          <ThemeToggle />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}