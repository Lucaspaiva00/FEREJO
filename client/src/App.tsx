import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { trpc } from "@/lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider, useApp } from "./contexts/AppContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import AppLayout from "./components/AppLayout";
import TenantSelector from "./components/TenantSelector";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Checklist from "./pages/Checklist";
import Campaigns from "./pages/Campaigns";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Strategies from "./pages/Strategies";
import Trainings from "./pages/Trainings";
import Commercial from "./pages/Commercial";
import Agenda from "./pages/Agenda";
import Planos from "./pages/Planos";
import ChangePasswordModal from "./components/ChangePasswordModal";

function AppContent() {
  const { user, loading, activeTab, refetchUser } = useApp();
  const userMeQuery = trpc.users.me.useQuery(undefined, { enabled: !!user });
  const mustChangePw = userMeQuery.data?.mustChangePassword === true;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold tracking-[0.3em] text-[#C9A227] logo-pulse mb-4">FAREJO</div>
          <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "checklist": return <Checklist />;
      case "campaigns": return <Campaigns />;
      case "strategies": return <Strategies />;
      case "commercial": return <Commercial />;
      case "agenda": return <Agenda />;
      case "planos": return <Planos />;
      case "trainings": return <Trainings />;
      case "settings": return <Settings />;
      case "admin": return user.role === "admin" ? <Admin /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout>
      <TenantSelector />
      {renderTab()}
      <ChangePasswordModal open={mustChangePw} onDone={() => { userMeQuery.refetch(); refetchUser(); }} />
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <RealtimeProvider>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </RealtimeProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
