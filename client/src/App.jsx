import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">ReflectIQ</p>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Private relationship intelligence, scoped to the right connection.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Sign in to access only the relationships you belong to. Each connection keeps its own questionnaire,
            memory, coaching, insights, and analysis with no cross-contamination between contexts.
          </p>
        </div>
        <Card className="w-full max-w-xl border border-border/70 shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="font-display text-3xl">
              {mode === "login" ? "Sign In" : "Create Account"}
            </CardTitle>
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
            {mode === "register" ? (
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            ) : null}
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
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
  const { loading, user } = useRelationshipAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading relationship context…</div>;
  }

  if (!user) {
    return <AuthScreen />;
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
