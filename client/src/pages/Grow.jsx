import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Link2, Send, Inbox, ArrowUpRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Insights from "@/pages/Insights";
import AnalysisEngine from "@/pages/AnalysisEngine";
import KnowledgeHub from "@/pages/KnowledgeHub";
import PlayLab from "@/pages/PlayLab";
import RelationshipRoadmap from "@/pages/RelationshipRoadmap";
import PlayLabII from "@/pages/PlayLabII";
import InsightLibrary from "@/pages/InsightLibrary";
import HealthReport from "@/pages/HealthReport";
import VisionBoard from "@/pages/VisionBoard";
import RelationshipPlaybook from "@/pages/RelationshipPlaybook";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { id: "overview", label: "Overview", section: "insights", route: "/insights", description: "Connection-level executive summary and trendline." },
  { id: "insights", label: "Insights", section: "insights", route: "/insights", description: "Compatibility, strengths, risk areas, and recommendations." },
  { id: "patterns", label: "Patterns", section: "analysis", route: "/analysis", description: "Behavioral and communication loops extracted from signals." },
  { id: "deep-analysis", label: "Deep Analysis", section: "analysis", route: "/analysis", description: "Extended analysis with health report detail." },
  { id: "analysis-engine", label: "Analysis Engine", section: "analysis", route: "/analysis", description: "Multi-perspective analysis workspace." },
  { id: "multi-perspective", label: "Multi-Perspective", section: "analysis", route: "/analysis", description: "Directional view by speaker and receiver." },
  { id: "pattern-scores", label: "Pattern Scores", section: "analysis", route: "/playbook", description: "Score-informed view tied to playbook actions." },
  { id: "predictive-layer", label: "Predictive Layer", section: "analysis", route: "/play-lab-ii", description: "Forward risk and outcome simulation layer." },
  { id: "knowledge-hub", label: "Knowledge Hub", section: "knowledge", route: "/knowledge", description: "AI insights mapped to trusted resources." },
  { id: "play-lab", label: "Play Lab", section: "knowledge", route: "/play-lab", description: "Interactive scenario and empathy training modules." },
  { id: "growth-roadmap", label: "Growth Roadmap", section: "knowledge", route: "/roadmap", description: "Milestone plan and monthly execution focus." },
  { id: "resources", label: "Resources", section: "knowledge", route: "/insight-library", description: "Curated resource library and reference materials." },
];

export default function Grow() {
  const { secondaryPerson, activeRelationship, relationshipLabel } = useRelationshipAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const requestedView = searchParams.get("view") || "overview";
  const validIds = useMemo(() => new Set(sidebarItems.map((item) => item.id)), []);
  const activeSidebarItem = validIds.has(requestedView) ? requestedView : "overview";

  const contentBySidebarItem = {
    overview: <Insights />,
    insights: <Insights />,
    patterns: <AnalysisEngine />,
    "deep-analysis": <AnalysisEngine />,
    "analysis-engine": <AnalysisEngine />,
    "multi-perspective": <AnalysisEngine />,
    "pattern-scores": <AnalysisEngine />,
    "predictive-layer": <AnalysisEngine />,
    "knowledge-hub": <KnowledgeHub />,
    "play-lab": <PlayLab />,
    "growth-roadmap": <RelationshipRoadmap />,
    resources: <InsightLibrary />,
  };

  const analysisExtendedViews = {
    "health-report": <HealthReport />,
    vision: <VisionBoard />,
    playbook: <RelationshipPlaybook />,
    "play-lab-ii": <PlayLabII />,
  };

  const handleSidebarSelect = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", item.id);
    setSearchParams(next, { replace: true });
  };

  const handleOpenDedicatedPage = (item) => {
    if (!item?.route) return;
    navigate(item.route);
  };

  const currentSidebarContent = contentBySidebarItem[activeSidebarItem] || <Insights />;
  const activeItemMeta = sidebarItems.find((item) => item.id === activeSidebarItem) || sidebarItems[0];

  const connectionName = activeRelationship?.name || relationshipLabel || "This Connection";
  const connectionSubtitle = activeRelationship?.description || activeRelationship?.goal || "Better Together";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 border-r border-border/50 bg-card/40 backdrop-blur-sm flex flex-col",
          sidebarOpen ? "w-56" : "w-0"
        )}
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-4 border-b border-border/30">
              <h3 className="font-semibold text-foreground text-sm">Navigation</h3>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSidebarSelect(item)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    activeSidebarItem === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-3 py-3 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => handleOpenDedicatedPage(activeItemMeta)}
              >
                Open Full Page
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sidebar Toggle + Header */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur px-4 md:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            <div>
              <h1 className="text-4xl font-bold text-foreground font-display">Grow</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Intelligence hub for insights, analysis, knowledge, and growth
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">

            {/* Active Connection Context Banner */}
            <div className="rounded-xl bg-gradient-to-r from-[#0a2a3f] to-[#0e6f72] p-5 text-white flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Context</p>
                <h2 className="text-lg font-semibold leading-snug">{connectionName}</h2>
                {connectionSubtitle && (
                  <p className="text-sm text-white/70">{connectionSubtitle}</p>
                )}
              </div>
              <Link2 className="w-5 h-5 text-white/40 shrink-0 mt-1" />
            </div>

            {/* Connection Actions */}
            {secondaryPerson && (
              <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Connection Actions</p>
                <p className="text-sm text-muted-foreground">
                  Send a direct note to {secondaryPerson} from anywhere in this relationship.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/tester-inbox")}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send to {secondaryPerson}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2"
                    onClick={() => navigate("/tester-inbox")}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    Open Inbox
                  </Button>
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active View</p>
                    <h3 className="text-base font-semibold text-foreground">{activeItemMeta.label}</h3>
                    <p className="text-sm text-muted-foreground">{activeItemMeta.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleOpenDedicatedPage(activeItemMeta)}
                  >
                    Open Full Page
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {currentSidebarContent}
              {activeSidebarItem === "deep-analysis" ? analysisExtendedViews["health-report"] : null}
              {activeSidebarItem === "multi-perspective" ? analysisExtendedViews.vision : null}
              {activeSidebarItem === "pattern-scores" ? analysisExtendedViews.playbook : null}
              {activeSidebarItem === "predictive-layer" ? analysisExtendedViews["play-lab-ii"] : null}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
