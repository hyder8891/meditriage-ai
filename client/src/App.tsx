import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Landing from "./pages/Landing";
import Triage from "./pages/Triage";
import Advice from "./pages/Advice";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminTraining from "./pages/AdminTraining";
import AdminLoginTraditional from "./pages/AdminLoginTraditional";
import PortalSelection from "./pages/PortalSelection";
import ClinicianLogin from "./pages/ClinicianLogin";
import ClinicianDashboard from "./pages/ClinicianDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={PortalSelection} />
      <Route path={"/home"} component={Landing} />
      <Route path={"/clinician/login"} component={ClinicianLogin} />
      <Route path={"/clinician/dashboard"} component={ClinicianDashboard} />
      <Route path={"/triage"} component={Triage} />
      <Route path={"/advice"} component={Advice} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/login/traditional"} component={AdminLoginTraditional} />
      <Route path={"/admin/training"} component={AdminTraining} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
