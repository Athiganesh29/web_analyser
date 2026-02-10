import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import AnalyzerRedirect from './pages/AnalyzerRedirect';
import { AnalyzerDashboard } from './pages/AnalyzerDashboard';
import { ReportDashboard } from './pages/ReportDashboard';
import { CompetitorDashboard } from './pages/CompetitorDashboard';
import './App.css';

const FULLSCREEN_ROUTES = ['/analyze', '/dashboard', '/report', '/competitor'];

function AppLayout() {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => location.pathname.startsWith(r));

  if (isFullscreen) {
    return (
      <Routes>
        <Route path="/analyze" element={<AnalyzerRedirect />} />
        <Route path="/dashboard/:reportId" element={<AnalyzerDashboard />} />
        <Route path="/report/:reportId" element={<ReportDashboard />} />
        <Route path="/competitor/:comparisonId" element={<CompetitorDashboard />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyze" element={<AnalyzerRedirect />} />
          <Route path="/dashboard/:reportId" element={<AnalyzerDashboard />} />
          <Route path="/analyzer" element={<Navigate to="/" replace />} />
          <Route path="*" element={<div className="not-found">Page Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;

