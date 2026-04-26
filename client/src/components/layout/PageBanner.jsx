/**
 * PageBanner — enterprise-style teal gradient banner shown at the top
 * of every page's content area. Derives title/subtitle from the nav items.
 */
import React from "react";
import { useLocation } from "react-router-dom";
import {
  ActivitySquare,
  BarChart3,
  BookOpenText,
  Bot,
  BrainCircuit,
  CalendarCheck2,
  ClipboardList,
  Handshake,
  Gamepad2,
  Layers3,
  LayoutDashboard,
  LibraryBig,
  Link2,
  MessagesSquare,
  NotebookPen,
  ShieldAlert,
  Telescope,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getRelationshipTerms } from "@/lib/relationshipParticipants";

const PAGE_META = {
  "/":             { label: "Context: Us",       subtitle: "Understanding each other deeply, communicating with intention, and growing together — powered by insight.", icon: LayoutDashboard },
  "/journal":      { label: "Journal",            subtitle: "A private writing space for this connection",      icon: NotebookPen },
  "/vision":       { label: "Vision Board",       subtitle: "Pin your shared dreams and aspirations",         icon: Telescope },
  "/playbook":     { label: "Playbook",           subtitle: "Your relationship operating manual and templates", icon: BookOpenText },
  "/play-lab-ii":  { label: "Play Lab II",        subtitle: "Guided session-based experiences for understanding, repair, and connection", icon: Layers3 },
  "/play-lab":     { label: "Play Lab",           subtitle: "Interactive relationship learning that makes the app smarter over time", icon: Gamepad2 },
  "/profiles":     { label: "Profiles",           subtitle: "Behavioral profiles built from your data",       icon: Users },
  "/questionnaire":{ label: "Questionnaire",      subtitle: "Build relationship context through reflection",  icon: ClipboardList },
  "/analysis":     { label: "Analysis Engine",    subtitle: "Multi-perspective relationship intelligence",    icon: BrainCircuit },
  "/roadmap":      { label: "Growth Roadmap",     subtitle: "Your 6-month personalized growth plan",         icon: TrendingUp },
  "/daily":        { label: "Daily Connections",  subtitle: "One question. Two perspectives. Every day.",     icon: Handshake },
  "/insight-library":{ label: "Insight Library",  subtitle: "Every analysis saved and searchable",           icon: LibraryBig },
  "/knowledge":    { label: "Knowledge Hub",      subtitle: "AI insights + curated psychology resources",    icon: BookOpenText },
  "/coach":        { label: "AI Coach",           subtitle: "Context-aware guidance for real situations",    icon: Bot },
  "/insights":     { label: "Insights",           subtitle: "Deep relationship pattern analysis",            icon: BarChart3 },
  "/check-in":     { label: "Weekly Check-In",    subtitle: "Track how you're growing together",            icon: CalendarCheck2 },
  "/tools":        { label: "Smart Tools",        subtitle: "Real-time support for in-the-moment challenges", icon: Wrench },
  "/triggers":     { label: "Trigger Library",    subtitle: "Know what activates you — and each other",     icon: ShieldAlert },
  "/repair":       { label: "Proactive Repair",   subtitle: "AI-guided repair after tension or conflict",    icon: ShieldAlert },
  "/chat":         { label: "Relationship Chat",  subtitle: "Open conversation with your AI relationship coach", icon: MessagesSquare },
  "/health-report": { label: "Health Report",     subtitle: "An enterprise-grade snapshot of your relationship health", icon: ActivitySquare },
};

export default function PageBanner() {
  const location = useLocation();
  const { activeRelationship, relationshipLabel } = useRelationshipAuth();
  const customHeroRoutes = new Set(["/journal", "/playbook", "/health-report"]);

  if (customHeroRoutes.has(location.pathname)) {
    return null;
  }

  const meta = PAGE_META[location.pathname] || { label: "Context: Us", subtitle: "Better Together", icon: Link2 };
  const Icon = meta.icon;
  const terms = getRelationshipTerms(activeRelationship);
  let label = meta.label;
  let subtitle = meta.subtitle;
  if (location.pathname === "/journal") {
    subtitle = `A private writing space for ${relationshipLabel}`;
  } else if (location.pathname === "/playbook") {
    label = terms.type === "romantic" ? "Playbook" : `${terms.typeLabel} Playbook`;
    subtitle =
      terms.type === "romantic"
        ? "Your relationship operating manual and templates"
        : `Your ${terms.typeLabel.toLowerCase()} playbook and working templates`;
  } else if (location.pathname === "/play-lab") {
    label = terms.type === "romantic" ? "Play Lab" : `${terms.typeLabel} Play Lab`;
    subtitle = `Interactive learning for this ${terms.bond} that makes the app smarter over time`;
  } else if (location.pathname === "/questionnaire") {
    subtitle = `Build private ${terms.bond} context through reflection`;
  } else if (location.pathname === "/analysis") {
    subtitle = `Multi-perspective ${terms.bond} intelligence`;
  } else if (location.pathname === "/insights") {
    subtitle = `Deep ${terms.bond} pattern analysis`;
  } else if (location.pathname === "/check-in") {
    subtitle = `Track how your ${terms.bond} is growing over time`;
  } else if (location.pathname === "/tools") {
    subtitle = `Real-time support for in-the-moment challenges inside this ${terms.bond}`;
  } else if (location.pathname === "/knowledge") {
    label = terms.type === "romantic" ? "Knowledge Hub" : `${terms.typeLabel} Knowledge Hub`;
    subtitle = `AI insights + curated psychology resources for this ${terms.bond}`;
  } else if (location.pathname === "/chat") {
    label = terms.type === "romantic" ? "Relationship Chat" : `${terms.typeLabel} Chat`;
    subtitle = `Open conversation with your AI coach for this ${terms.bond}`;
  } else if (location.pathname === "/health-report") {
    label = terms.type === "romantic" ? "Health Report" : `${terms.typeLabel} Health Report`;
    subtitle =
      terms.type === "romantic"
        ? "An enterprise-grade snapshot of your relationship health"
        : "An enterprise-grade snapshot of your connection health";
  }

  return (
    <div className="enterprise-hero mb-8 overflow-hidden">
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">
            Context: Us
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {label}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-teal-100/75 mt-0.5">{subtitle}</p>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mt-1">
          <Icon className="w-5 h-5 text-teal-200" />
        </div>
      </div>
    </div>
  );
}
