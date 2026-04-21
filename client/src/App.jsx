import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

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
import RelationshipJournal from './pages/RelationshipJournal.jsx';
import VisionBoard from './pages/VisionBoard.jsx';
import HealthReport from './pages/HealthReport.jsx';
import ReferenceAppendix from './pages/ReferenceAppendix.jsx';

const ApplicationRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
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
        <Route path="/journal" element={<RelationshipJournal />} />
        <Route path="/vision" element={<VisionBoard />} />
        <Route path="/health-report" element={<HealthReport />} />
        <Route path="/appendix" element={<ReferenceAppendix />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ApplicationRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
