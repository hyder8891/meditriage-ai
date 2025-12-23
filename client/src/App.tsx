import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TourProvider } from "./contexts/TourContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { GuidedTour } from "./components/GuidedTour";
import { useErrorReporting } from "./hooks/useErrorReporting";
import { useAuth } from "./hooks/useAuth";
import { trpc } from "./lib/trpc";
import { useEffect } from "react";
import Home from "./pages/Home";
import NewHome from "./pages/NewHome";
import MedHome from "./pages/MedHome";
import SymptomChecker from "./pages/SymptomChecker";
import SymptomCheckerStructured from "./pages/SymptomCheckerStructured";
import BRAINAnalysis from "./pages/BRAINAnalysis";
import BRAINDashboard from "./pages/BRAINDashboard";
import TrainingDashboard from "./pages/TrainingDashboard";
import BrainPerformance from "./pages/BrainPerformance";
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

import LiveScribe from "./pages/LiveScribe";
import LabResults from "./pages/LabResults";
import CaseTimeline from "./pages/CaseTimeline";
import XRayAnalysis from "./pages/XRayAnalysis";
import ClinicianCalendar from "./pages/ClinicianCalendar";
import MedicationManagement from "./pages/MedicationManagement";
import PatientMedications from "./pages/PatientMedications";
import PatientPortal from "./pages/PatientPortal";
import SecureMessaging from "./pages/SecureMessaging";
import AdminDashboard from "./pages/AdminDashboard";
import Patients from "./pages/Patients";
import TestNotifications from "./pages/TestNotifications";
import AddPatient from "./pages/AddPatient";
import Reports from "./pages/Reports";
import PatientDetail from "./pages/PatientDetail";
import MyPatients from "./pages/MyPatients";
import FindDoctor from "./pages/FindDoctor";
import MyDoctors from "./pages/MyDoctors";
import Messages from "./pages/Messages";
import PatientSubscription from "./pages/PatientSubscription";
import DoctorSubscription from "./pages/DoctorSubscription";
import PatientProfile from "./pages/PatientProfile";
import DoctorProfile from "./pages/DoctorProfile";
import DebugUser from "./pages/DebugUser";
import DebugAuth from "./pages/DebugAuth";
import AdminUsers from "./pages/AdminUsers";
import Settings from "./pages/Settings";
import PatientMedicalRecords from "./pages/PatientMedicalRecords";
import BioScannerPage from "./pages/patient/BioScannerPage";
import { PatientVitalsViewer } from "./pages/clinician/PatientVitalsViewer";
import VitalsTrends from "./pages/VitalsTrends";
import { Redirect } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"}>
        {() => {
          const { user } = useAuth();
          if (!user) return <Redirect to="/patient-login" />;
          if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
          if (user.role === 'clinician' || user.role === 'doctor') return <Redirect to="/clinician/dashboard" />;
          return <Redirect to="/patient/portal" />;
        }}
      </Route>
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
      <Route path={"/clinician/reasoning"}>
        {() => <ProtectedRoute requiredRole="clinician"><ClinicalReasoning /></ProtectedRoute>}
      </Route>
      <Route path={"/patient/symptom-checker"} component={PatientSymptomChecker} />
      <Route path={"/clinician/pharmaguard"}>
        {() => <ProtectedRoute requiredRole="clinician"><PharmaGuard /></ProtectedRoute>}
      </Route>
      <Route path={"/patient/care-locator"}>
        {() => <ProtectedRoute requiredRole="patient"><CareLocator /></ProtectedRoute>}
      </Route>

      <Route path={"/clinician/live-scribe"}>
        {() => <ProtectedRoute requiredRole="clinician"><LiveScribe /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/lab-results"}>
        {() => <ProtectedRoute requiredRole="clinician"><LabResults /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/case/:id/timeline"}>
        {() => <ProtectedRoute requiredRole="clinician"><CaseTimeline /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/xray-analysis"}>
        {() => <ProtectedRoute requiredRole="clinician"><XRayAnalysis /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/calendar"}>
        {() => <ProtectedRoute requiredRole="clinician"><ClinicianCalendar /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/medications"}>
        {() => <ProtectedRoute requiredRole="clinician"><MedicationManagement /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/messages"}>
        {() => <ProtectedRoute requiredRole="clinician"><SecureMessaging /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/patients"}>
        {() => <ProtectedRoute requiredRole="clinician"><Patients /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/patients/add"}>
        {() => <ProtectedRoute requiredRole="clinician"><AddPatient /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/patient/:id"}>
        {() => <ProtectedRoute requiredRole="clinician"><PatientDetail /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/reports"}>
        {() => <ProtectedRoute requiredRole="clinician"><Reports /></ProtectedRoute>}
      </Route>
      <Route path={"/clinician/my-patients"}>
        {() => <ProtectedRoute requiredRole="clinician"><MyPatients /></ProtectedRoute>}
      </Route>
      <Route path="/patient/find-doctor" component={FindDoctor} />
      <Route path="/patient/find-doctors" component={FindDoctor} />
      <Route path={"/patient/my-doctors"} component={MyDoctors} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/patient/messages"} component={Messages} />
      <Route path={"/patient/subscription"} component={PatientSubscription} />
      <Route path={"/clinician/subscription"}>
        {() => <ProtectedRoute requiredRole="clinician"><DoctorSubscription /></ProtectedRoute>}
      </Route>
      <Route path={"/patient/medications"} component={PatientMedications} />
      <Route path="/patient/portal">
        {() => <ProtectedRoute requiredRole="patient"><PatientPortal /></ProtectedRoute>}
      </Route>
      <Route path="/patient/medical-records">
        {() => <ProtectedRoute requiredRole="patient"><PatientMedicalRecords /></ProtectedRoute>}
      </Route>
      <Route path="/patient/bio-scanner">
        {() => <ProtectedRoute requiredRole="patient"><BioScannerPage /></ProtectedRoute>}
      </Route>
      <Route path="/patient/vitals-trends">
        {() => <ProtectedRoute requiredRole="patient"><VitalsTrends /></ProtectedRoute>}
      </Route>
      <Route path="/patient/profile">
        {() => <ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>}
      </Route>
      <Route path="/clinician/profile">
        {() => <ProtectedRoute requiredRole="clinician"><DoctorProfile /></ProtectedRoute>}
      </Route>
      <Route path="/clinician/patient-vitals">
        {() => <ProtectedRoute requiredRole="clinician"><PatientVitalsViewer /></ProtectedRoute>}
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
      <Route path={"/admin/users"}>
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path={"/settings"} component={Settings} />
      <Route path={"/symptom-checker"} component={SymptomCheckerStructured} />
      <Route path={"/brain"} component={BRAINAnalysis} />
      <Route path={"/brain/dashboard"} component={BRAINDashboard} />
      <Route path={"/brain/training"} component={TrainingDashboard} />
      <Route path={"/brain/performance"} component={BrainPerformance} />
      <Route path={"/symptom-checker-old"} component={SymptomChecker} />
      <Route path={"/test-notifications"} component={TestNotifications} />
      <Route path={"/debug-user"} component={DebugUser} />
      <Route path={"/debug-auth"} component={DebugAuth} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize AEC error reporting
  useErrorReporting();
  
  // Auto-refresh token mechanism
  const { refreshToken, setToken, isAuthenticated } = useAuth();
  const refreshMutation = trpc.auth.refreshToken.useMutation();

  useEffect(() => {
    // Only set up auto-refresh if user is authenticated and has refresh token
    if (!isAuthenticated || !refreshToken) {
      return;
    }

    // Refresh token every 14 minutes (before 15-minute expiry)
    const interval = setInterval(async () => {
      try {
        console.log('[Auto-Refresh] Refreshing access token...');
        const result = await refreshMutation.mutateAsync({ refreshToken });
        setToken(result.token);
        console.log('[Auto-Refresh] Token refreshed successfully');
      } catch (error) {
        console.error('[Auto-Refresh] Failed to refresh token:', error);
        // Token refresh failed - user needs to log in again
        // The error will be caught by the auth system
      }
    }, 14 * 60 * 1000); // 14 minutes

    // Also refresh immediately if we're close to expiry
    const refreshNow = async () => {
      try {
        const result = await refreshMutation.mutateAsync({ refreshToken });
        setToken(result.token);
        console.log('[Auto-Refresh] Initial token refresh successful');
      } catch (error) {
        console.error('[Auto-Refresh] Initial refresh failed:', error);
      }
    };
    refreshNow();

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, setToken]);
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <NotificationProvider>
            <TourProvider>
              <TooltipProvider>
                <Router />
                <GuidedTour />
              </TooltipProvider>
            </TourProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
