import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Insights from "@/pages/Insights";
import AnalysisEngine from "@/pages/AnalysisEngine";
import KnowledgeHub from "@/pages/KnowledgeHub";
import PlayLab from "@/pages/PlayLab";
import RelationshipRoadmap from "@/pages/RelationshipRoadmap";
import PlayLabII from "@/pages/PlayLabII";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { id: "overview", label: "Overview", section: "insights" },
  { id: "insights", label: "Insights", section: "insights" },
  { id: "patterns", label: "Patterns", section: "analysis" },
  { id: "deep-analysis", label: "Deep Analysis", section: "analysis" },
  { id: "analysis-engine", label: "Analysis Engine", section: "analysis" },
  { id: "multi-perspective", label: "Multi-Perspective", section: "analysis" },
  { id: "pattern-scores", label: "Pattern Scores", section: "analysis" },
  { id: "predictive-layer", label: "Predictive Layer", section: "analysis" },
  { id: "knowledge-hub", label: "Knowledge Hub", section: "knowledge" },
  { id: "play-lab", label: "Play Lab", section: "knowledge" },
  { id: "growth-roadmap", label: "Growth Roadmap", section: "knowledge" },
  { id: "resources", label: "Resources", section: "knowledge" },
];

export default function Grow() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("insights");
  const [activeSidebarItem, setActiveSidebarItem] = useState("overview");

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
                  onClick={() => {
                    setActiveTab(item.section);
                    setActiveSidebarItem(item.id);
                  }}
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
          <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tabs List */}
              <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8 bg-card/50">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge Hub</TabsTrigger>
              </TabsList>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <Insights />
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6">
                <AnalysisEngine />
              </TabsContent>

              {/* Knowledge Hub Tab */}
              <TabsContent value="knowledge" className="space-y-6">
                <KnowledgeHub />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
