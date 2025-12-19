import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TourProvider } from "./contexts/TourContext";
import { GuidedTour } from "./components/GuidedTour";
import Home from "./pages/Home";
import NewHome from "./pages/NewHome";
import MedHome from "./pages/MedHome";
import SymptomChecker from "./pages/SymptomChecker";
import SymptomCheckerStructured from "./pages/SymptomCheckerStructured";
import PatientLogin from "./pages/PatientLogin";
import ClinicianLoginNew from "./pages/ClinicianLoginNew";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import ClinicalReasoning from "./pages/ClinicalReasoning";
import PatientSymptomChecker from "./pages/PatientSymptomChecker";
import PharmaGuard from "./pages/PharmaGuard";
import CareLocator from "./pages/CareLocator";
import BioScanner from "./pages/BioScanner";
import LiveScribe from "./pages/LiveScribe";
import CaseTimeline from "./pages/CaseTimeline";
import XRayAnalysis from "./pages/XRayAnalysis";
import ClinicianCalendar from "./pages/ClinicianCalendar";
import MedicationManagement from "./pages/MedicationManagement";
import PatientMedications from "./pages/PatientMedications";
import PatientPortal from "./pages/PatientPortal";
import SecureMessaging from "./pages/SecureMessaging";
import AdminDashboard from "./pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/old-home3"} component={MedHome} />
      <Route path={"/old-home2"} component={NewHome} />
      <Route path={"/patient-login"} component={PatientLogin} />
      <Route path={"/clinician-login"} component={ClinicianLoginNew} />
      <Route path={"/portal-selection"} component={PortalSelection} />
      <Route path={"/home"} component={Landing} />
      <Route path={"/clinician/login"} component={ClinicianLogin} />
      <Route path={"/clinician/dashboard"}>
        {() => <ProtectedRoute requiredRole="clinician"><ClinicianDashboard /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/reasoning"} component={ClinicalReasoning} />
      <Route path={"/patient/symptom-checker"} component={PatientSymptomChecker} />
      <Route path={"/clinician/pharmaguard"} component={PharmaGuard} />
      <Route path={"/clinician/care-locator"} component={CareLocator} />
      <Route path={"/clinician/bio-scanner"} component={BioScanner} />
      <Route path={"/clinician/live-scribe"} component={LiveScribe} />
      <Route path={"/clinician/case/:id/timeline"} component={CaseTimeline} />
      <Route path={"/clinician/xray-analysis"} component={XRayAnalysis} />
      <Route path={"/clinician/calendar"} component={ClinicianCalendar} />      <Route path={"/clinician/medications"} component={MedicationManagement} />
      <Route path={"/clinician/messages"} component={SecureMessaging} />
      <Route path={"/patient/medications"} component={PatientMedications} />
      <Route path={"/patient/portal"}>
        {() => <ProtectedRoute requiredRole="patient"><PatientPortal /></ProtectedRoute>}
      </Route>
      <Route path={"/triage"} component={Triage} />
      <Route path={"/advice"} component={Advice} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/dashboard"}>
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/login/traditional"} component={AdminLoginTraditional} />
      <Route path={"/admin/training"} component={AdminTraining} />
      <Route path={"/symptom-checker"} component={SymptomCheckerStructured} />
      <Route path={"/symptom-checker-old"} component={SymptomChecker} />
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
          <TourProvider>
            <TooltipProvider>
              <Router />
              <GuidedTour />
            </TooltipProvider>
          </TourProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
