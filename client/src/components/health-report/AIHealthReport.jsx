/**
 * AIHealthReport.jsx — AI-generated narrative section of the health report
 */
import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/api/client";
import { safeInvokeLLM, CreditLimitError } from "@/lib/aiSafe";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import { format, subDays } from "date-fns";
import ResponseExportBar from "@/components/export/ResponseExportBar";

function buildReportPrompt({ checkIns, reflections, coachSessions, weekLabel, viewMode, participants, relationshipLabel }) {
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants || [];
  const subject =
    viewMode === primaryPerson
      ? `${primaryPerson} within ${relationshipLabel}`
      : viewMode === secondaryPerson
      ? `${secondaryPerson} within ${relationshipLabel}`
      : relationshipLabel;
  const recentCheckIns = checkIns.slice(0, 8);
  const recentReflections = reflections.slice(0, 10);
  const recentSessions = coachSessions.slice(0, 5);

  const checkInSummary = recentCheckIns
    .map((c) => `[${c.person_name}, ${c.week_label}, mood: ${c.mood}] Worked: ${c.what_worked}. Improve: ${c.what_could_improve}. Grateful: ${c.gratitude || "—"}`)
    .join("\n");

  const reflectionSummary = recentReflections
    .map((r) => `[${r.person_name}, mood: ${r.mood}] ${r.answer}`)
    .join("\n");

  const sessionSummary = recentSessions
    .map((s) => `[${s.speaker}→${s.speaking_to}] ${s.situation}`)
    .join("\n");

  return `You are a relationship intelligence system generating a weekly Relationship Health Report focused on ${subject}.

WEEK: ${weekLabel}

RECENT CHECK-INS (mood + reflections):
${checkInSummary || "None yet."}

DAILY REFLECTIONS:
${reflectionSummary || "None yet."}

AI COACH SESSIONS:
${sessionSummary || "None yet."}

Generate a structured Relationship Health Report with these sections:
1. **Overall Health Pulse** — 2-3 sentences on the relevant relational health this period.
2. **Sentiment Trends** — What emotional tones are showing up? Are things improving, plateauing, or under strain?
3. **Communication Patterns** — What communication strengths and friction patterns are visible across check-ins and sessions?
4. **Key Themes This Week** — The 3-5 most significant themes emerging from their data (e.g. distance, gratitude, repair, vulnerability).
5. **What's Working** — 2-3 specific things going well based on the data.
6. **Areas to Watch** — 2-3 growth areas or subtle risks visible in the data.
7. **One Focused Intention** — A single, actionable focus for the coming week grounded in the data.

Be warm, insightful, and evidence-based. Reference specific things from their data where possible. Keep each section concise (2-4 sentences max). Do NOT make assumptions not supported by the data.`;
}

export default function AIHealthReport({ checkIns, reflections, coachSessions, viewMode = "compare", participants = ["Tony", "Drew"], relationshipLabel = "this relationship" }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creditError, setCreditError] = useState(false);
  const reportRef = useRef(null);

  const weekLabel = `Week of ${format(new Date(), "MMM d, yyyy")}`;

  const generate = async () => {
    setLoading(true);
    setCreditError(false);
    try {
      const result = await safeInvokeLLM(
        {
          prompt: buildReportPrompt({ checkIns, reflections, coachSessions, weekLabel, viewMode, participants, relationshipLabel }),
          model: "claude_sonnet_4_6",
          partnerLanguage:
            viewMode === participants[0]
              ? { personName: participants[0], partnerName: participants[1], replacePronouns: false }
              : viewMode === participants[1]
              ? { personName: participants[1], partnerName: participants[0], replacePronouns: false }
              : { personName: participants[0], partnerName: participants[1], replacePronouns: false },
        },
        40000,
        null
      );
      setReport(result);
    } catch (err) {
      if (err instanceof CreditLimitError) {
        setCreditError(true);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {creditError && <CreditLimitBanner />}

      {!report ? (
        <Card className="enterprise-panel border-2">
          <CardContent className="p-8 text-center space-y-4">
            <FileText className="w-10 h-10 text-primary mx-auto opacity-70" />
            <div>
              <p className="text-lg font-semibold text-foreground">Generate Your Health Report</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                AI will analyze your check-ins, reflections, and coach sessions to produce a personalised weekly narrative.
              </p>
            </div>
            <Button onClick={generate} disabled={loading || (checkIns.length === 0 && reflections.length === 0)} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {loading ? "Generating report..." : "Generate Report"}
            </Button>
            {checkIns.length === 0 && reflections.length === 0 && (
              <p className="text-xs text-muted-foreground">Add some check-ins or reflections first to power this report.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <ResponseExportBar
            contentRef={reportRef}
            content={report}
            filename={`health-report-${weekLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`}
            title={`Relationship Health Report — ${weekLabel}`}
            showEmail={false}
          />
        <Card className="enterprise-panel border-2" ref={reportRef}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-primary" />
                {viewMode === "compare"
                  ? `AI Relationship Health Report — ${weekLabel}`
                  : `AI ${viewMode} Health Report — ${weekLabel}`}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="gap-1.5 text-xs">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Regenerate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-headings:font-display">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
