import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  Users, 
  AlertCircle, 
  Clock,
  Search,
  Plus,
  FileText,
  TrendingUp,
  LogOut,
  Menu,
  Mic,
  FileImage,
  Calendar,
  Pill,
  MessageSquare
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ClinicianDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/clinician/login");
    },
  });

  const { data: cases, isLoading: casesLoading } = trpc.clinical.getAllCases.useQuery();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNewCase = () => {
    // Navigate to Clinical Reasoning to create a new case
    setLocation("/clinician/reasoning");
  };

  // Redirect if not authenticated or not admin
  if (!authLoading && (!user || user.role !== 'admin')) {
    setLocation("/clinician/login");
    return null;
  }

  const activeCases = cases?.filter((c: any) => c.status === "active") || [];
  const emergencyCases = activeCases.filter((c: any) => c.urgency === "emergency");
  const urgentCases = activeCases.filter((c: any) => c.urgency === "urgent");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-lg text-gray-900">MediTriage AI</h2>
                <p className="text-xs text-gray-500">Medical OS</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <Activity className="w-5 h-5 mr-3" />
              {sidebarOpen && "Dashboard"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/reasoning")}
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              {sidebarOpen && "Clinical Reasoning"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/pharmaguard")}
            >
              <FileText className="w-5 h-5 mr-3" />
              {sidebarOpen && "PharmaGuard"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/care-locator")}
            >
              <Users className="w-5 h-5 mr-3" />
              {sidebarOpen && "Care Locator"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/bio-scanner")}
            >
              <Activity className="w-5 h-5 mr-3" />
              {sidebarOpen && "3D Bio-Scanner"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/live-scribe")}
            >
              <Mic className="w-5 h-5 mr-3" />
              {sidebarOpen && "Live Scribe"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/xray-analysis")}
            >
              <FileImage className="w-5 h-5 mr-3" />
              {sidebarOpen && "X-Ray Analysis"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/calendar")}
            >
              <Calendar className="w-5 h-5 mr-3" />
              {sidebarOpen && "Calendar"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/medications")}
            >
              <Pill className="w-5 h-5 mr-3" />
              {sidebarOpen && "Medications"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/messages")}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              {sidebarOpen && "Messages"}
            </Button>
          </nav>

          <div className="absolute bottom-4 left-0 right-0 px-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {sidebarOpen && "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, Dr. {user?.name || "Clinician"}</p>
            </div>
            <Button onClick={handleNewCase} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900">{activeCases.length}</div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700">Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-red-700">{emergencyCases.length}</div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-700">Urgent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-orange-700">{urgentCases.length}</div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900">{cases?.length || 0}</div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients by name or complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
          </div>

          {/* Cases List */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>Manage your patient cases</CardDescription>
            </CardHeader>
            <CardContent>
              {casesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading cases...</div>
              ) : activeCases.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No active cases</p>
                  <Button onClick={handleNewCase}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Case
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCases
                    .filter((c: any) => 
                      searchQuery === "" || 
                      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((caseItem: any) => (
                      <div
                        key={caseItem.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                        onClick={() => setLocation(`/clinician/case/${caseItem.id}/timeline`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{caseItem.patientName}</h3>
                              {caseItem.urgency && (
                                <Badge
                                  className={
                                    caseItem.urgency === "emergency"
                                      ? "bg-red-100 text-red-700"
                                      : caseItem.urgency === "urgent"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-blue-100 text-blue-700"
                                  }
                                >
                                  {caseItem.urgency}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{caseItem.chiefComplaint}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {caseItem.patientAge && <span>Age: {caseItem.patientAge}</span>}
                              {caseItem.patientGender && <span>Gender: {caseItem.patientGender}</span>}
                              <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
