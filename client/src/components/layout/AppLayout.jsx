import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  CalendarCheck2,
  Bot,
  Menu,
  X,
  Wrench,
  ShieldAlert,
  LogOut,
  MessagesSquare,
  BrainCircuit,
  LibraryBig,
  BookOpenText,
  TrendingUp,
  Handshake,
  NotebookPen,
  Telescope,
  ActivitySquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import PageBanner from "@/components/layout/PageBanner";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navGroups = [
  {
    id: "core",
    label: "Core Workspace",
    items: [
      { path: "/", label: "Home", icon: LayoutDashboard },
      { path: "/journal", label: "Journal", icon: NotebookPen },
      { path: "/health-report", label: "Health Report", icon: ActivitySquare },
      { path: "/vision", label: "Vision Board", icon: Telescope },
      { path: "/playbook", label: "Playbook", icon: BookOpenText },
    ],
  },
  {
    id: "intelligence",
    label: "Relationship Intelligence",
    items: [
      { path: "/profiles", label: "Profiles", icon: Users },
      { path: "/questionnaire", label: "Questionnaire", icon: ClipboardList },
      { path: "/analysis", label: "Analysis Engine", icon: BrainCircuit },
      { path: "/insights", label: "Insights", icon: BarChart3 },
      { path: "/roadmap", label: "Growth Roadmap", icon: TrendingUp },
      { path: "/daily", label: "Daily Connections", icon: Handshake },
      { path: "/insight-library", label: "Insight Library", icon: LibraryBig },
      { path: "/knowledge", label: "Knowledge Hub", icon: BookOpenText },
    ],
  },
  {
    id: "support",
    label: "Support Tools",
    items: [
      { path: "/coach", label: "AI Coach", icon: Bot },
      { path: "/check-in", label: "Check-In", icon: CalendarCheck2 },
      { path: "/tools", label: "Smart Tools", icon: Wrench },
      { path: "/triggers", label: "Triggers", icon: ShieldAlert },
      { path: "/repair", label: "Proactive Repair", icon: ShieldAlert },
      { path: "/chat", label: "Relationship Chat", icon: MessagesSquare },
      { path: "/appendix", label: "Appendix", icon: BookMarked },
    ],
  },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    core: true,
    intelligence: true,
    support: true,
  });
  const [mobileGroupOpen, setMobileGroupOpen] = useState({
    core: false,
    intelligence: false,
    support: false,
  });

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const toggleMobileGroup = (groupId) => {
    setMobileGroupOpen((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar fixed h-full z-30 shadow-[6px_0_30px_rgba(15,23,42,0.08)] transition-all duration-300",
          sidebarCollapsed ? "w-[92px]" : "w-72"
        )}
      >
        <div className={cn("border-b border-border", sidebarCollapsed ? "p-4" : "p-6")}>
          <div className="flex items-start justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/35 bg-white/5 p-1 shrink-0">
                <img src="/site-logo.png" alt="ReflectIQ logo" className="h-full w-full rounded-xl object-contain" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-display text-lg font-semibold tracking-tight text-white">ReflectIQ</h1>
                  <p className="text-[10px] text-teal-200/70 tracking-[0.24em] uppercase">Relationship Intelligence</p>
                </div>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 text-teal-100 hover:bg-white/10 hover:text-white"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <nav className={cn("flex-1 overflow-y-auto", sidebarCollapsed ? "p-3 space-y-2" : "p-4 space-y-4")}>
          {navGroups.map((group) => {
            const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);
            return (
              <div key={group.id} className="space-y-2">
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition-all",
                      groupHasActiveItem
                        ? "border-primary/20 bg-white/5 text-white"
                        : "border-transparent text-teal-200/70 hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">{group.label}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openGroups[group.id] ? "rotate-0" : "-rotate-90")} />
                  </button>
                ) : (
                  <div className="px-2 pt-2">
                    <div className="h-px w-full bg-white/10" />
                  </div>
                )}

                {(sidebarCollapsed || openGroups[group.id]) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={cn(
                            "flex items-center rounded-2xl border text-sm font-medium transition-all duration-200",
                            sidebarCollapsed
                              ? "justify-center px-3 py-3"
                              : "gap-3 px-3 py-2.5",
                            active
                              ? "border-primary/40 bg-primary/15 text-white shadow-sm"
                              : "border-transparent text-teal-200/85 hover:border-primary/20 hover:bg-sidebar-accent hover:text-white"
                          )}
                        >
                          <item.icon className="w-4.5 h-4.5 shrink-0" />
                          {!sidebarCollapsed && item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className={cn("border-t border-border", sidebarCollapsed ? "p-3" : "p-4")}>
          <button
            onClick={() => api.auth.logout()}
            className={cn(
              "flex w-full items-center rounded-2xl text-xs transition-all mb-2",
              sidebarCollapsed
                ? "justify-center px-3 py-3 text-teal-200/80 hover:text-white hover:bg-sidebar-accent"
                : "gap-2 px-3 py-2 text-teal-200/80 hover:text-white hover:bg-sidebar-accent"
            )}
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!sidebarCollapsed && "Sign Out"}
          </button>
          {!sidebarCollapsed && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              This app provides guidance based on behavioral patterns. It is not a substitute for licensed therapy.
            </p>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src="/site-logo.png" alt="ReflectIQ logo" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display font-semibold text-foreground">ReflectIQ</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="space-y-3 border-b border-border bg-card px-4 pb-4">
            {navGroups.map((group) => {
              const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);
              return (
                <div key={group.id} className="rounded-2xl border border-border/60 bg-muted/20">
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup(group.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors",
                      groupHasActiveItem ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      {group.label}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", mobileGroupOpen[group.id] ? "rotate-0" : "-rotate-90")} />
                  </button>

                  {mobileGroupOpen[group.id] && (
                    <div className="space-y-1 px-2 pb-2">
                      {group.items.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className={cn("flex-1 pt-14 lg:pt-0 transition-all duration-300", sidebarCollapsed ? "lg:ml-[92px]" : "lg:ml-72")}>
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
