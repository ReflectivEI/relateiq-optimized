import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { useState } from "react";

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Profiles from './pages/Profiles.jsx';
import Questionnaire from './pages/Questionnaire';
import Coach from './pages/Coach.jsx';
import Insights from './pages/Insights.jsx';
import CheckIn from './pages/CheckIn.jsx';
import SmartTools from './pages/SmartTools.jsx';
import TriggerLibrary from './pages/TriggerLibrary.jsx';
import ProactiveRepair from './pages/ProactiveRepair.jsx';
import DownloadData from './pages/DownloadData.jsx';
import RelationshipChat from './pages/RelationshipChat.jsx';
import AnalysisEngine from './pages/AnalysisEngine.jsx';
import InsightLibrary from './pages/InsightLibrary.jsx';
import KnowledgeHub from './pages/KnowledgeHub.jsx';
import RelationshipRoadmap from './pages/RelationshipRoadmap.jsx';
import DailyConnections from './pages/DailyConnections.jsx';
import RelationshipPlaybook from './pages/RelationshipPlaybook.jsx';
import PlayLab from './pages/PlayLab.jsx';
import RelationshipJournal from './pages/RelationshipJournal.jsx';
import VisionBoard from './pages/VisionBoard.jsx';
import HealthReport from './pages/HealthReport.jsx';
import ReferenceAppendix from './pages/ReferenceAppendix.jsx';
import InviteAcceptPage from './pages/InviteAcceptPage.jsx';
import { RelationshipAuthProvider, useRelationshipAuth } from './context/RelationshipAuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Sparkles } from "lucide-react";

function AuthScreen() {
  const { login, register, error } = useRelationshipAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setLocalError("");
    try {
      if (mode === "register") {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">ReflectIQ</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Private relationship intelligence for the right connection.
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-6 text-muted-foreground">
            Sign in to choose a relationship context. All coaching, memory, questionnaire responses, and
            insights stay isolated inside the selected connection.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Shield, title: "Private by design", copy: "Only designated logins can access the relationship they belong to." },
              { icon: Users, title: "Admin-managed", copy: "Owner/admin creates connections, assigns credentials, and sends the invite link." },
              { icon: Sparkles, title: "Questionnaire-first", copy: "Each new connection starts clean and routes into the full 94-question setup." },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
        <Card className="w-full max-w-xl border border-border/70 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="font-display text-4xl">ReflectIQ</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in to choose a relationship context. All coaching, memory, and insights stay isolated inside the selected relationship.
            </p>
            <div className="flex gap-2">
              <Button variant={mode === "login" ? "default" : "outline"} className="flex-1" onClick={() => setMode("login")}>
                Sign In
              </Button>
              <Button variant={mode === "register" ? "default" : "outline"} className="flex-1" onClick={() => setMode("register")}>
                Create Account
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm leading-6">
                <p className="font-semibold text-foreground">If you are the admin/owner</p>
                <p className="mt-1 text-muted-foreground">
                  Sign in with your owner account first. Then use <span className="font-medium text-foreground">Add Connection</span> to:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>name the relationship</li>
                  <li>choose romantic, friendship, family, or other</li>
                  <li>assign the second person’s name, email, and password</li>
                  <li>generate the private invite link to share with them</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
                <p className="font-semibold text-foreground">If you are the invited user</p>
                <p className="mt-1 text-muted-foreground">
                  Use the email and password given to you by the owner/admin, then open the invite link.
                  After you join, the app will route you to the <span className="font-medium text-foreground">Questionnaire first</span>.
                  Complete that before using the rest of the site so your analysis, AI Coach guidance, and insights are accurate.
                </p>
              </div>
            </div>
            {mode === "register" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tony" />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tony@relateiq.local" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Admin setup flow</p>
              <p>
                After sign in, the owner/admin can create a private connection, assign the second person’s
                name, email, and password, and generate an invite link that opens the live site.
              </p>
            </div>
            {localError || error ? <p className="text-sm text-red-600">{localError || error}</p> : null}
            <Button onClick={handleSubmit} disabled={submitting || !email || !password || (mode === "register" && !name)} className="w-full">
              {submitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { loading, user, activeRelationship } = useRelationshipAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading relationship context…</div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (activeRelationship?.needs_questionnaire && location.pathname === "/") {
    return <Navigate to="/questionnaire" replace state={{ gatedByQuestionnaire: true }} />;
  }

  return <AppLayout />;
}

const ApplicationRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/tools" element={<SmartTools />} />
        <Route path="/triggers" element={<TriggerLibrary />} />
        <Route path="/repair" element={<ProactiveRepair />} />
        <Route path="/download-data" element={<DownloadData />} />
        <Route path="/chat" element={<RelationshipChat />} />
        <Route path="/analysis" element={<AnalysisEngine />} />
        <Route path="/insight-library" element={<InsightLibrary />} />
        <Route path="/knowledge" element={<KnowledgeHub />} />
        <Route path="/roadmap" element={<RelationshipRoadmap />} />
        <Route path="/daily" element={<DailyConnections />} />
        <Route path="/playbook" element={<RelationshipPlaybook />} />
        <Route path="/play-lab" element={<PlayLab />} />
        <Route path="/journal" element={<RelationshipJournal />} />
        <Route path="/vision" element={<VisionBoard />} />
        <Route path="/health-report" element={<HealthReport />} />
        <Route path="/appendix" element={<ReferenceAppendix />} />
      </Route>
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <RelationshipAuthProvider>
        <Router>
          <ApplicationRoutes />
        </Router>
        <Toaster />
      </RelationshipAuthProvider>
    </QueryClientProvider>
  )
}

export default App
