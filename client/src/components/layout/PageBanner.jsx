/**
 * PageBanner — enterprise-style teal gradient banner shown at the top
 * of every page's content area. Derives title/subtitle from the nav items.
 */
import React from "react";
import { useLocation } from "react-router-dom";
import { Heart, Home, User, MessageCircleHeart, BarChart3, CalendarCheck, Sparkles, Zap, HeartHandshake, MessagesSquare, BrainCircuit, Library, BookOpen, TrendingUp, Sunrise, BookMarked, Stars } from "lucide-react";

const PAGE_META = {
  "/":             { label: "Home",              subtitle: "Your relationship command center",               icon: Home },
  "/journal":      { label: "Journal",            subtitle: "Your private reflection timeline",               icon: BookMarked },
  "/vision":       { label: "Vision Board",       subtitle: "Pin your shared dreams and aspirations",         icon: Stars },
  "/playbook":     { label: "Playbook",           subtitle: "Your personalized relationship guide",           icon: BookOpen },
  "/profiles":     { label: "Profiles",           subtitle: "Behavioral profiles built from your data",       icon: User },
  "/questionnaire":{ label: "Questionnaire",      subtitle: "Build relationship context through reflection",  icon: MessageCircleHeart },
  "/analysis":     { label: "Analysis Engine",    subtitle: "Multi-perspective relationship intelligence",    icon: BrainCircuit },
  "/roadmap":      { label: "Growth Roadmap",     subtitle: "Your 6-month personalized growth plan",         icon: TrendingUp },
  "/daily":        { label: "Daily Connections",  subtitle: "One question. Two perspectives. Every day.",     icon: Sunrise },
  "/insight-library":{ label: "Insight Library",  subtitle: "Every analysis saved and searchable",           icon: Library },
  "/knowledge":    { label: "Knowledge Hub",      subtitle: "AI insights + curated psychology resources",    icon: BookOpen },
  "/coach":        { label: "AI Coach",           subtitle: "Context-aware guidance for real situations",    icon: Sparkles },
  "/insights":     { label: "Insights",           subtitle: "Deep relationship pattern analysis",            icon: BarChart3 },
  "/check-in":     { label: "Weekly Check-In",    subtitle: "Track how you're growing together",            icon: CalendarCheck },
  "/tools":        { label: "Smart Tools",        subtitle: "Real-time support for in-the-moment challenges", icon: Zap },
  "/triggers":     { label: "Trigger Library",    subtitle: "Know what activates you — and each other",     icon: Zap },
  "/repair":       { label: "Proactive Repair",   subtitle: "AI-guided repair after tension or conflict",    icon: HeartHandshake },
  "/chat":         { label: "Relationship Chat",  subtitle: "Open conversation with your AI relationship coach", icon: MessagesSquare },
};

export default function PageBanner() {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { label: "Context: Us", subtitle: "Better Together", icon: Heart };
  const Icon = meta.icon;

  return (
    <div
      className="rounded-xl border border-border mb-8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(178 40% 22%) 0%, hsl(195 45% 18%) 60%, hsl(218 44% 18%) 100%)",
      }}
    >
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-300/70">
            Context: Us
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {meta.label}
          </h2>
          <p className="text-sm text-teal-100/70 mt-0.5">{meta.subtitle}</p>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mt-1">
          <Icon className="w-5 h-5 text-teal-200" />
        </div>
      </div>
    </div>
  );
}