import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Coach from "@/pages/Coach";
import CheckIn from "@/pages/CheckIn";
import RelationshipJournal from "@/pages/RelationshipJournal";
import DailyConnections from "@/pages/DailyConnections";
import RelationshipChat from "@/pages/RelationshipChat";

export default function Reflect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode") || "coach";
  const [mode, setMode] = useState(requestedMode);

  const modeItems = useMemo(
    () => [
      { id: "coach", label: "AI Coach" },
      { id: "whatHappened", label: "What Happened" },
      { id: "mirror", label: "Reflection Mirror" },
      { id: "checkIn", label: "Check-In" },
      { id: "journal", label: "Journal" },
      { id: "daily", label: "Daily Connections" },
    ],
    [],
  );

  const modeDescription = {
    coach: "Context-aware coaching for immediate guidance and clean action steps.",
    whatHappened: "Structured weekly reflection to understand what happened and what to do next.",
    mirror: "Dual-perspective intelligence to understand both sides of the same moment.",
    checkIn: "Weekly relationship check-in with robust insight and export-ready summaries.",
    journal: "Private writing, timeline continuity, and clean exports for reflection history.",
    daily: "Daily prompts that strengthen consistency, empathy, and emotional signal tracking.",
  };

  const renderModeContent = () => {
    if (mode === "coach") return <Coach />;
    if (mode === "whatHappened") return <CheckIn />;
    if (mode === "mirror") return <RelationshipChat />;
    if (mode === "checkIn") return <CheckIn />;
    if (mode === "journal") return <RelationshipJournal />;
    if (mode === "daily") return <DailyConnections />;
    return <Coach />;
  };

  React.useEffect(() => {
    if (requestedMode !== mode) {
      setMode(requestedMode);
    }
  }, [requestedMode, mode]);

  const handleModeSelect = (nextMode) => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-display">Reflect</h1>
          <p className="text-muted-foreground text-lg">
            Get guidance, process what's happening, or explore deeper insights about your connection.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {modeItems.map((item) => (
            <Button
              key={item.id}
              variant={mode === item.id ? "default" : "outline"}
              onClick={() => handleModeSelect(item.id)}
              className="gap-2 rounded-lg font-medium"
            >
              {item.label}
            </Button>
          ))}
        </div>

        <p className="mb-6 text-sm text-muted-foreground">{modeDescription[mode]}</p>

        {/* Mode Content */}
        <div className="space-y-6">{renderModeContent()}</div>
      </div>
    </div>
  );
}
