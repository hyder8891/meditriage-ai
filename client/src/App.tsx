import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TourProvider } from "./contexts/TourContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { GuidedTour } from "./components/GuidedTour";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useErrorReporting } from "./hooks/useErrorReporting";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Redirect } from "wouter";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

// Lazy load all page components for better performance
const Home = lazy(() => import("./pages/Home"));
const NewHome = lazy(() => import("./pages/NewHome"));
const MedHome = lazy(() => import("./pages/MedHome"));
const SymptomChecker = lazy(() => import("./pages/SymptomChecker"));
const SymptomCheckerStructured = lazy(() => import("./pages/SymptomCheckerStructured"));
const BRAINAnalysis = lazy(() => import("./pages/BRAINAnalysis"));
const BRAINDashboard = lazy(() => import("./pages/BRAINDashboard"));
const TrainingDashboard = lazy(() => import("./pages/TrainingDashboard"));
const BrainPerformance = lazy(() => import("./pages/BrainPerformance"));
const PatientLogin = lazy(() => import("./pages/PatientLogin"));
const Landing = lazy(() => import("./pages/Landing"));
const Triage = lazy(() => import("./pages/Triage"));
const Advice = lazy(() => import("./pages/Advice"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLoginTraditional = lazy(() => import("./pages/AdminLoginTraditional"));
const PortalSelection = lazy(() => import("./pages/PortalSelection"));
const ModernSymptomChecker = lazy(() => import("./pages/ModernSymptomChecker"));
const CareLocator = lazy(() => import("./pages/CareLocator"));
const PatientMedications = lazy(() => import("./pages/PatientMedications"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TestNotifications = lazy(() => import("./pages/TestNotifications"));
const Messages = lazy(() => import("./pages/Messages"));
const PatientSubscription = lazy(() => import("./pages/PatientSubscription"));
const PatientProfile = lazy(() => import("./pages/PatientProfile"));
const DebugUser = lazy(() => import("./pages/DebugUser"));
const DebugAuth = lazy(() => import("./pages/DebugAuth"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const PatientMedicalRecords = lazy(() => import("./pages/PatientMedicalRecords"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Medications = lazy(() => import("./pages/Medications"));
const BioScannerPage = lazy(() => import("./pages/patient/BioScannerPage"));
const VitalsTrends = lazy(() => import("./pages/VitalsTrends"));
const LoadTestDashboard = lazy(() => import("./pages/LoadTestDashboard"));
const PatientAppointments = lazy(() => import("./pages/PatientAppointments"));
const PatientPharmaGuard = lazy(() => import("./pages/patient/PatientPharmaGuard"));
const LabResultsExplainer = lazy(() => import("./pages/patient/LabResultsExplainer"));
const MedicalReportAnalysis = lazy(() => import("./pages/patient/MedicalReportAnalysis"));
const PatientMedicalLiterature = lazy(() => import("./pages/patient/PatientMedicalLiterature"));
const ConditionLibrary = lazy(() => import("./pages/patient/ConditionLibrary"));
const TreatmentGuide = lazy(() => import("./pages/patient/TreatmentGuide"));
const SecondOpinionPrep = lazy(() => import("./pages/patient/SecondOpinionPrep"));
const HealthScoreDashboard = lazy(() => import("./pages/patient/HealthScoreDashboard"));
const FamilyHealthVault = lazy(() => import("./pages/patient/FamilyHealthVault"));
const SmartMatching = lazy(() => import("./pages/SmartMatching"));
const ConsultationRoom = lazy(() => import("./pages/ConsultationRoom"));
const ConsultationHistory = lazy(() => import("./pages/ConsultationHistory"));
const SelfHealingDashboard = lazy(() => import("./pages/SelfHealingDashboard"));
const TrainTheBrain = lazy(() => import("./pages/TrainTheBrain"));
const MedicalLiterature = lazy(() => import("./pages/MedicalLiterature"));
const Certificates = lazy(() => import("./pages/Certificates"));
const SecureAdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const SecureAdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SecureAdminPatients = lazy(() => import("./pages/admin/AdminPatients"));
const AdminVerificationQueue = lazy(() => import("./pages/AdminVerificationQueue"));
const PatientBooking = lazy(() => import("./pages/PatientBooking"));
const PatientSymptomChecker = lazy(() => import("./pages/PatientSymptomChecker"));
const EnhancedSymptomChecker = lazy(() => import("./pages/EnhancedSymptomChecker"));

// Import all admin feature pages
import * as AdminFeatures from "./pages/admin/index";

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/dashboard"}>
          {() => {
            const { user } = useAuth();
            if (!user) return <Redirect to="/patient-login" />;
            if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
            return <Redirect to="/patient/portal" />;
          }}
        </Route>
        <Route path={"/old-home3"} component={MedHome} />
        <Route path={"/old-home2"} component={NewHome} />
        <Route path={"/patient-login"} component={PatientLogin} />
        <Route path={"/portal-selection"} component={PortalSelection} />
        <Route path={"/home"} component={Landing} />
        
        {/* Patient Routes */}
        <Route path={"/patient/symptom-checker"} component={ModernSymptomChecker} />
        <Route path={"/patient/symptom-checker-old"} component={PatientSymptomChecker} />
        <Route path={"/patient/care-locator"}>
          {() => <ProtectedRoute requiredRole="patient"><CareLocator /></ProtectedRoute>}
        </Route>
        <Route path={"/messages"} component={Messages} />
        <Route path={"/patient/messages"} component={Messages} />
        <Route path={"/patient/subscription"} component={PatientSubscription} />
        <Route path={"/patient/medications"} component={PatientMedications} />
        <Route path="/patient/portal">
          {() => <ProtectedRoute requiredRole="patient"><PatientPortal /></ProtectedRoute>}
        </Route>
        <Route path="/patient/medical-records">
          {() => <ProtectedRoute requiredRole="patient"><PatientMedicalRecords /></ProtectedRoute>}
        </Route>
        <Route path="/medical-records">
          {() => <ProtectedRoute><MedicalRecords /></ProtectedRoute>}
        </Route>
        <Route path="/appointments">
          {() => <ProtectedRoute><Appointments /></ProtectedRoute>}
        </Route>
        <Route path="/medications">
          {() => <ProtectedRoute><Medications /></ProtectedRoute>}
        </Route>
        <Route path="/patient/bio-scanner">
          {() => <ProtectedRoute requiredRole="patient"><BioScannerPage /></ProtectedRoute>}
        </Route>
        <Route path="/patient/vitals-trends">
          {() => <ProtectedRoute requiredRole="patient"><VitalsTrends /></ProtectedRoute>}
        </Route>
        <Route path="/patient/appointments">
          {() => <ProtectedRoute requiredRole="patient"><PatientAppointments /></ProtectedRoute>}
        </Route>
        <Route path="/patient/smart-matching">
          {() => <ProtectedRoute requiredRole="patient"><SmartMatching /></ProtectedRoute>}
        </Route>
        <Route path="/consultation/:id" component={ConsultationRoom} />
        <Route path="/patient/consultation-history">
          {() => <ProtectedRoute requiredRole="patient"><ConsultationHistory /></ProtectedRoute>}
        </Route>
        <Route path="/patient/profile">
          {() => <ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>}
        </Route>
        <Route path="/patient/pharmaguard">
          {() => <ProtectedRoute requiredRole="patient"><PatientPharmaGuard /></ProtectedRoute>}
        </Route>
        <Route path="/patient/lab-results">
          {() => <ProtectedRoute requiredRole="patient"><LabResultsExplainer /></ProtectedRoute>}
        </Route>
        <Route path="/patient/report-analysis">
          {() => <ProtectedRoute requiredRole="patient"><MedicalReportAnalysis /></ProtectedRoute>}
        </Route>
        <Route path="/patient/health-library">
          {() => <ProtectedRoute requiredRole="patient"><PatientMedicalLiterature /></ProtectedRoute>}
        </Route>
        <Route path="/patient/condition-library">
          {() => <ProtectedRoute requiredRole="patient"><ConditionLibrary /></ProtectedRoute>}
        </Route>
        <Route path="/patient/treatment-guide">
          {() => <ProtectedRoute requiredRole="patient"><TreatmentGuide /></ProtectedRoute>}
        </Route>
        <Route path="/patient/second-opinion-prep">
          {() => <ProtectedRoute requiredRole="patient"><SecondOpinionPrep /></ProtectedRoute>}
        </Route>
        <Route path="/patient/health-score">
          {() => <ProtectedRoute requiredRole="patient"><HealthScoreDashboard /></ProtectedRoute>}
        </Route>
        <Route path="/patient/family-vault">
          {() => <ProtectedRoute requiredRole="patient"><FamilyHealthVault /></ProtectedRoute>}
        </Route>
        <Route path={"/patient/booking/:doctorId"}>
          {(params) => <ProtectedRoute><PatientBooking doctorId={parseInt(params.doctorId)} /></ProtectedRoute>}
        </Route>

        {/* General Routes */}
        <Route path={"/triage"} component={Triage} />
        <Route path={"/advice"} component={Advice} />
        <Route path={"/profile"} component={Profile} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/certificates"}>
          <ProtectedRoute><Certificates /></ProtectedRoute>
        </Route>
        <Route path={"/test-notifications"} component={TestNotifications} />
        <Route path={"/symptom-checker"} component={SymptomChecker} />
 <Route path={"/symptom-checker-structured"} component={SymptomCheckerStructured} />
        <Route path={"/enhanced-symptom-checker"} component={EnhancedSymptomChecker} />
        <Route path={"/brain-analysis"} component={BRAINAnalysis} />
        <Route path={"/brain-dashboard"} component={BRAINDashboard} />
        <Route path={"/training-dashboard"} component={TrainingDashboard} />
        <Route path={"/train-the-brain"} component={TrainTheBrain} />
        <Route path={"/brain-performance"} component={BrainPerformance} />
        <Route path={"/medical-literature"}>
          {() => <ProtectedRoute requiredRole="admin"><MedicalLiterature /></ProtectedRoute>}
        </Route>
        <Route path={"/debug/user"} component={DebugUser} />
        <Route path={"/debug/auth"} component={DebugAuth} />

        {/* Admin Routes */}
        <Route path={"/admin"} component={Admin} />
        <Route path={"/admin/dashboard"}>
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/login"} component={AdminLogin} />
        <Route path={"/admin/secret-login"} component={SecureAdminLogin} />
        <Route path={"/admin/patients"} component={SecureAdminPatients} />
        <Route path="/admin/verification-queue">
          {() => <ProtectedRoute requiredRole="admin"><AdminVerificationQueue /></ProtectedRoute>}
        </Route>
        
        {/* Analytics & Monitoring */}
        <Route path={"/admin/budget"} component={AdminFeatures.AdminBudget} />
        <Route path={"/admin/orchestration"} component={AdminFeatures.AdminOrchestration} />
        <Route path={"/admin/load-test"} component={AdminFeatures.AdminLoadTest} />
        <Route path={"/admin/self-healing"} component={AdminFeatures.AdminSelfHealing} />
        
        {/* Clinical Tools */}
        <Route path={"/admin/clinical"} component={AdminFeatures.AdminClinical} />
        <Route path={"/admin/triage"} component={AdminFeatures.AdminTriage} />
        <Route path={"/admin/symptom-checker"} component={AdminFeatures.AdminSymptomChecker} />
        <Route path={"/admin/audio-symptom"} component={AdminFeatures.AdminAudioSymptom} />
        <Route path={"/admin/smart-forms"} component={AdminFeatures.AdminSmartForms} />
        
        {/* Patient Engagement */}
        <Route path={"/admin/wearables"} component={AdminFeatures.AdminWearables} />
        <Route path={"/admin/weather"} component={AdminFeatures.AdminWeather} />
        <Route path={"/admin/air-quality"} component={AdminFeatures.AdminAirQuality} />
        <Route path={"/admin/conversations"} component={AdminFeatures.AdminConversations} />
        <Route path={"/admin/chat-history"} component={AdminFeatures.AdminChatHistory} />
        
        {/* Business Features */}
        <Route path={"/admin/b2b2c"} component={AdminFeatures.AdminB2B2C} />
        <Route path={"/admin/resource-auction"} component={AdminFeatures.AdminResourceAuction} />
        <Route path={"/admin/preferences"} component={AdminFeatures.AdminPreferences} />
        
        {/* Auth & Onboarding */}
        <Route path={"/admin/phone-auth"} component={AdminFeatures.AdminPhoneAuth} />
        <Route path={"/admin/oauth"} component={AdminFeatures.AdminOAuth} />
        <Route path={"/admin/onboarding"} component={AdminFeatures.AdminOnboarding} />
        
        {/* Lab & Testing */}
        <Route path={"/admin/lab-results"} component={AdminFeatures.AdminLabResults} />
        <Route path={"/admin/triage-queue"} component={AdminFeatures.AdminTriageQueue} />
        <Route path={"/admin/login/traditional"} component={AdminLoginTraditional} />
        <Route path={"/admin/users"}>
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/load-test-dashboard"}>
          <ProtectedRoute requiredRole="admin">
            <LoadTestDashboard />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/self-healing-dashboard"}>
          <ProtectedRoute requiredRole="admin">
            <SelfHealingDashboard />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/analytics"}>
          <ProtectedRoute requiredRole="admin">
            <AdminAnalytics />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/settings"}>
          <ProtectedRoute requiredRole="admin">
            <AdminSettings />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useErrorReporting();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TourProvider>
            <NotificationProvider>
              <TooltipProvider>
                <OfflineIndicator />
                <Router />
                <GuidedTour />
              </TooltipProvider>
            </NotificationProvider>
          </TourProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
