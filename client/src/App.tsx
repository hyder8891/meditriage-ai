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
import { useErrorReporting } from "./hooks/useErrorReporting";
import { useAuth } from "./hooks/useAuth";
import { trpc } from "./lib/trpc";
import { useEffect } from "react";
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
const ClinicianLoginNew = lazy(() => import("./pages/ClinicianLoginNew"));
const Landing = lazy(() => import("./pages/Landing"));
const Triage = lazy(() => import("./pages/Triage"));
const Advice = lazy(() => import("./pages/Advice"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLoginTraditional = lazy(() => import("./pages/AdminLoginTraditional"));
const BudgetTracking = lazy(() => import("./pages/BudgetTracking"));
const OrchestrationLogs = lazy(() => import("./pages/OrchestrationLogs"));
const PortalSelection = lazy(() => import("./pages/PortalSelection"));
const ClinicianLogin = lazy(() => import("./pages/ClinicianLogin"));
const ClinicianDashboard = lazy(() => import("./pages/ClinicianDashboard"));
const ClinicalReasoning = lazy(() => import("./pages/ClinicalReasoning"));
const PatientSymptomChecker = lazy(() => import("./pages/PatientSymptomChecker"));
const ModernSymptomChecker = lazy(() => import("./pages/ModernSymptomChecker"));
const PharmaGuard = lazy(() => import("./pages/PharmaGuard"));
const PharmaGuardEnhanced = lazy(() => import("./pages/PharmaGuardEnhanced"));
const CareLocator = lazy(() => import("./pages/CareLocator"));
const LiveScribe = lazy(() => import("./pages/LiveScribe"));
const LabResults = lazy(() => import("./pages/LabResults"));
const CaseTimeline = lazy(() => import("./pages/CaseTimeline"));
const XRayAnalysis = lazy(() => import("./pages/XRayAnalysis"));
const MedicalReportsAnalysis = lazy(() => import("./pages/clinician/MedicalReportsAnalysis"));
const SOAPTemplates = lazy(() => import("./pages/SOAPTemplates"));
const ClinicianCalendar = lazy(() => import("./pages/ClinicianCalendar"));
const DoctorCalendar = lazy(() => import("./pages/DoctorCalendar"));
const PatientBooking = lazy(() => import("./pages/PatientBooking"));
const MedicationManagement = lazy(() => import("./pages/MedicationManagement"));
const PatientMedications = lazy(() => import("./pages/PatientMedications"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const SecureMessaging = lazy(() => import("./pages/SecureMessaging"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const TestNotifications = lazy(() => import("./pages/TestNotifications"));
const AddPatient = lazy(() => import("./pages/AddPatient"));
const Reports = lazy(() => import("./pages/Reports"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const MyPatients = lazy(() => import("./pages/MyPatients"));
const FindDoctor = lazy(() => import("./pages/FindDoctor"));
const MyDoctors = lazy(() => import("./pages/MyDoctors"));
const Messages = lazy(() => import("./pages/Messages"));
const PatientSubscription = lazy(() => import("./pages/PatientSubscription"));
const DoctorSubscription = lazy(() => import("./pages/DoctorSubscription"));
const PatientProfile = lazy(() => import("./pages/PatientProfile"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile"));
const DebugUser = lazy(() => import("./pages/DebugUser"));
const DebugAuth = lazy(() => import("./pages/DebugAuth"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const PatientMedicalRecords = lazy(() => import("./pages/PatientMedicalRecords"));
const BioScannerPage = lazy(() => import("./pages/patient/BioScannerPage"));
const PatientVitalsViewer = lazy(() => import("./pages/clinician/PatientVitalsViewer").then(m => ({ default: m.PatientVitalsViewer })));
const VitalsTrends = lazy(() => import("./pages/VitalsTrends"));
const LoadTestDashboard = lazy(() => import("./pages/LoadTestDashboard"));
const PatientAppointments = lazy(() => import("./pages/PatientAppointments"));
const ConsultationRoom = lazy(() => import("./pages/ConsultationRoom"));
const ConsultationHistory = lazy(() => import("./pages/ConsultationHistory"));
const MyDoctor = lazy(() => import("./pages/MyDoctor"));
const SelfHealingDashboard = lazy(() => import("./pages/SelfHealingDashboard"));
const Login = lazy(() => import("./pages/Login"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/home" component={MedHome} />
        <Route path={"/dashboard"}>
          {() => {
            const { user } = useAuth();
            if (!user) return <Redirect to="/patient-login" />;
            if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
            if (user.role === 'clinician') return <Redirect to="/clinician/dashboard" />;
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
        </Route>      <Route path={"/clinician/reasoning"}>
          {() => <ProtectedRoute requiredRole="clinician"><ClinicalReasoning /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/mydoctor"}>
          {() => <ProtectedRoute requiredRole="clinician"><MyDoctor /></ProtectedRoute>}
        </Route>
        <Route path={"/patient/symptom-checker"} component={ModernSymptomChecker} />
        <Route path={"/patient/symptom-checker-old"} component={PatientSymptomChecker} />
        <Route path={"/clinician/pharmaguard"}>
          {() => <ProtectedRoute requiredRole="clinician"><PharmaGuardEnhanced /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/pharmaguard-legacy"}>
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
        <Route path={"/clinician/soap-templates"}>
          {() => <ProtectedRoute requiredRole="clinician"><SOAPTemplates /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/medical-reports"}>
          {() => <ProtectedRoute requiredRole="clinician"><MedicalReportsAnalysis /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/calendar"}>
          {() => <ProtectedRoute requiredRole="clinician"><DoctorCalendar /></ProtectedRoute>}
        </Route>
        <Route path={"/patient/booking/:doctorId"}>
          {(params) => <ProtectedRoute><PatientBooking doctorId={parseInt(params.doctorId)} /></ProtectedRoute>}
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
        <Route path={"/clinician/patients/:id"}>
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
        <Route path="/patient/appointments">
          {() => <ProtectedRoute requiredRole="patient"><PatientAppointments /></ProtectedRoute>}
        </Route>
        <Route path="/consultation/:id" component={ConsultationRoom} />
        <Route path="/patient/consultation-history">
          {() => <ProtectedRoute requiredRole="patient"><ConsultationHistory /></ProtectedRoute>}
        </Route>
        <Route path="/clinician/consultations">
          {() => <ProtectedRoute requiredRole="clinician"><ConsultationHistory /></ProtectedRoute>}
        </Route>
        <Route path="/patient/profile">
          {() => <ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>}
        </Route>
        <Route path="/clinician/profile">
          {() => <ProtectedRoute requiredRole="clinician"><DoctorProfile /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/patient-vitals"}>
          {() => <ProtectedRoute requiredRole="clinician"><PatientVitalsViewer /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/budget-tracking"}>
          {() => <ProtectedRoute requiredRole="clinician"><BudgetTracking /></ProtectedRoute>}
        </Route>
        <Route path={"/clinician/orchestration-logs"}>
          {() => <ProtectedRoute requiredRole="clinician"><OrchestrationLogs /></ProtectedRoute>}
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
        {/* <Route path={"/admin/training"} component={AdminTraining} /> */}
        <Route path={"/admin/users"}>
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/load-test"}>
          <ProtectedRoute requiredRole="admin">
            <LoadTestDashboard />
          </ProtectedRoute>
        </Route>
        <Route path={"/admin/self-healing"}>
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
        <Route path={"/settings"} component={Settings} />
        <Route path={"/test-notifications"} component={TestNotifications} />
        <Route path={"/symptom-checker"} component={SymptomChecker} />
        <Route path={"/symptom-checker-structured"} component={SymptomCheckerStructured} />
        <Route path={"/brain-analysis"} component={BRAINAnalysis} />
        <Route path={"/brain-dashboard"} component={BRAINDashboard} />
        <Route path={"/training-dashboard"} component={TrainingDashboard} />
        <Route path={"/brain-performance"} component={BrainPerformance} />
        <Route path={"/debug/user"} component={DebugUser} />
        <Route path={"/debug/auth"} component={DebugAuth} />
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
