import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Stethoscope, 
  RefreshCw,
  Loader2,
  Activity,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  Eye,
  Brain,
  Heart,
  Pill,
  MapPin
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminClinicalRouters() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allCases, isLoading: casesLoading, refetch: refetchCases } = 
    trpc.clinical.getAllCases.useQuery();

  const { data: myCases, isLoading: myCasesLoading, refetch: refetchMyCases } = 
    trpc.clinical.getMyCases.useQuery();

  const handleRefreshAll = () => {
    refetchCases();
    refetchMyCases();
    toast.success('Data refreshed');
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Emergency</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Urgent</Badge>;
      case 'semi-urgent':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Semi-Urgent</Badge>;
      case 'non-urgent':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Non-Urgent</Badge>;
      case 'routine':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Routine</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'archived':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = casesLoading || myCasesLoading;

  // Filter cases by search query
  const filteredCases = allCases?.filter((c: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.patientName?.toLowerCase().includes(query) ||
      c.chiefComplaint?.toLowerCase().includes(query)
    );
  }) || [];

  // Calculate stats
  const stats = {
    totalCases: allCases?.length || 0,
    activeCases: allCases?.filter((c: any) => c.status === 'active').length || 0,
    emergencyCases: allCases?.filter((c: any) => c.urgency === 'emergency' || c.urgency === 'urgent').length || 0,
    completedToday: allCases?.filter((c: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return c.status === 'completed' && new Date(c.updatedAt) >= today;
    }).length || 0,
  };

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Stethoscope className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Clinical Routers</h1>
            </div>
            <p className="text-slate-400">Manage clinical decision support and routing systems</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="border-slate-700 text-slate-300"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Cases</CardTitle>
              <FileText className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalCases}</div>
              <p className="text-xs text-slate-500 mt-1">All clinical cases</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Cases</CardTitle>
              <Activity className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.activeCases}</div>
              <p className="text-xs text-slate-500 mt-1">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Urgent Cases</CardTitle>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.emergencyCases}</div>
              <p className="text-xs text-slate-500 mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Completed Today</CardTitle>
              <CheckCircle className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.completedToday}</div>
              <p className="text-xs text-slate-500 mt-1">Cases resolved today</p>
            </CardContent>
          </Card>
        </div>

        {/* Clinical Tools Overview */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Clinical Decision Support Tools</CardTitle>
            <CardDescription className="text-slate-400">
              Available clinical reasoning and support modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="font-medium text-white">Differential Diagnosis</span>
                </div>
                <p className="text-sm text-slate-400">
                  AI-powered differential diagnosis generation based on symptoms and vitals
                </p>
                <Badge className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="font-medium text-white">Vitals Analysis</span>
                </div>
                <p className="text-sm text-slate-400">
                  Real-time vital signs monitoring and abnormality detection
                </p>
                <Badge className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Pill className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="font-medium text-white">Medication Search</span>
                </div>
                <p className="text-sm text-slate-400">
                  Drug database search with interaction checking
                </p>
                <Badge className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="font-medium text-white">Facility Routing</span>
                </div>
                <p className="text-sm text-slate-400">
                  Emergency facility search and patient routing
                </p>
                <Badge className="mt-3 bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Management */}
        <Tabs defaultValue="all-cases" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="all-cases" className="data-[state=active]:bg-slate-700">
              All Cases
            </TabsTrigger>
            <TabsTrigger value="my-cases" className="data-[state=active]:bg-slate-700">
              My Cases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-cases">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">All Clinical Cases</CardTitle>
                    <CardDescription className="text-slate-400">
                      {filteredCases.length} cases found
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCases.length > 0 ? (
                  <div className="space-y-3">
                    {filteredCases.map((caseItem: any) => (
                      <div 
                        key={caseItem.id}
                        className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">{caseItem.patientName}</span>
                              {getUrgencyBadge(caseItem.urgency)}
                              {getStatusBadge(caseItem.status)}
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{caseItem.chiefComplaint}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {caseItem.patientAge ? `${caseItem.patientAge} years` : 'Age unknown'}
                                {caseItem.patientGender ? `, ${caseItem.patientGender}` : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(caseItem.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clinical cases found</p>
                    <p className="text-sm mt-2">Cases will appear here when created</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-cases">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">My Cases</CardTitle>
                <CardDescription className="text-slate-400">
                  Cases assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myCases && myCases.length > 0 ? (
                  <div className="space-y-3">
                    {myCases.map((caseItem: any) => (
                      <div 
                        key={caseItem.id}
                        className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">{caseItem.patientName}</span>
                              {getUrgencyBadge(caseItem.urgency)}
                              {getStatusBadge(caseItem.status)}
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{caseItem.chiefComplaint}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(caseItem.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No cases assigned to you</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Protocol Configuration */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Clinical Protocols</CardTitle>
            <CardDescription className="text-slate-400">
              Configure clinical decision pathways and protocols
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="font-medium text-white mb-2">Triage Protocol</h4>
                <p className="text-sm text-slate-400 mb-3">
                  5-level urgency classification system
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                  <Button variant="ghost" size="sm" className="text-slate-400">Configure</Button>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="font-medium text-white mb-2">Referral Pathways</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Specialty referral routing rules
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                  <Button variant="ghost" size="sm" className="text-slate-400">Configure</Button>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h4 className="font-medium text-white mb-2">Alert Thresholds</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Vital signs alert configuration
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
                  <Button variant="ghost" size="sm" className="text-slate-400">Configure</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
