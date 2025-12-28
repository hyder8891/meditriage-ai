import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Activity, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Shield,
  TrendingUp,
  UserPlus,
  AlertCircle,
  BarChart3,
  Clock,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Link } from "wouter";
import { useEffect } from "react";
import { AppLogo } from "@/components/AppLogo";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();
  
  // Fetch system stats
  const { data: stats, isLoading: statsLoading } = trpc.admin.getSystemStats.useQuery();
  
  // Fetch real-time dashboard analytics
  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getDashboardAnalytics.useQuery();
  
  // Fetch system health
  const { data: systemHealth } = trpc.admin.getSystemHealth.useQuery();
  
  // Fetch budget summary
  const { data: budgetSummary } = trpc.admin.getBudgetSummary.useQuery({ timeRange: "today" });

  // Mutations
  const verifyClinicianMutation = trpc.admin.verifyClinician.useMutation({
    onSuccess: () => {
      toast.success("Clinician verified successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleVerifyClinician = (userId: number) => {
    if (confirm("Are you sure you want to verify this clinician?")) {
      verifyClinicianMutation.mutate({ userId });
    }
  };

  const handleUpdateRole = (userId: number, role: "patient" | "clinician" | "admin") => {
    if (confirm(`Are you sure you want to change this user's role to ${role}?`)) {
      updateUserRoleMutation.mutate({ userId, role });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate({ userId });
    }
  };

  // Calculate additional stats
  const pendingClinicians = users?.filter(u => u.role === "clinician" && !u.verified) || [];
  const verifiedClinicians = users?.filter(u => u.role === "clinician" && u.verified) || [];
  const patients = users?.filter(u => u.role === "patient") || [];
  const admins = users?.filter(u => u.role === "admin") || [];
  const recentUsers = users?.slice(0, 5) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogo size="lg" showText={false} />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-teal-600" />
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                System overview and user management
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/load-test">
              <div className="inline-flex items-center justify-center rounded-md border border-purple-300 bg-transparent px-4 py-2 text-sm font-medium hover:bg-purple-50 cursor-pointer transition-colors">
                <Activity className="w-4 h-4 mr-2" />
                Load Testing
              </div>
            </Link>
            <Link to="/admin/users">
              <div className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 px-4 py-2 text-sm font-medium text-white cursor-pointer transition-colors">
                <Users className="w-4 h-4 mr-2" />
                Manage All Users
              </div>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {pendingClinicians.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Clinician Verifications ({pendingClinicians.length})
              </CardTitle>
              <CardDescription className="text-orange-700">
                There are clinicians waiting for account verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setSelectedTab("clinicians")}
                variant="outline"
                className="border-orange-300 hover:bg-orange-100"
              >
                Review Pending Clinicians
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="clinicians">
              <Shield className="w-4 h-4 mr-2" />
              Pending ({pendingClinicians.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Real-Time Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.activeUsersToday || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time activity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Triage Sessions</CardTitle>
                  <FileText className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.triageSessionsToday || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Today's sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                  <Users className="h-4 w-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.consultationsToday || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Today's consultations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.costTodayUSD || "0.00"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    API usage cost
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.errorRatePercent || "0.00"}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Today's error rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Health Alert */}
            {systemHealth && systemHealth.overallStatus !== "healthy" && (
              <Card className={systemHealth.overallStatus === "down" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}>
                <CardHeader>
                  <CardTitle className={systemHealth.overallStatus === "down" ? "text-red-800" : "text-orange-800"} >
                    <AlertCircle className="h-5 w-5 inline mr-2" />
                    System Health Warning
                  </CardTitle>
                  <CardDescription className={systemHealth.overallStatus === "down" ? "text-red-700" : "text-orange-700"}>
                    {systemHealth.servicesDown > 0 && `${systemHealth.servicesDown} service(s) down. `}
                    {systemHealth.servicesDegraded > 0 && `${systemHealth.servicesDegraded} service(s) degraded.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setSelectedTab("activity")}
                    variant="outline"
                    className={systemHealth.overallStatus === "down" ? "border-red-300 hover:bg-red-100" : "border-orange-300 hover:bg-orange-100"}
                  >
                    View System Health Details
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* User Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || users?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-600 font-medium">+{stats?.newUsersThisMonth || 0}</span> this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified Clinicians</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{verifiedClinicians.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active medical professionals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{pendingClinicians.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patients</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered patients
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* User Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Breakdown by role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Patients</span>
                    </div>
                    <span className="font-semibold">{patients.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Verified Clinicians</span>
                    </div>
                    <span className="font-semibold">{verifiedClinicians.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Pending Clinicians</span>
                    </div>
                    <span className="font-semibold">{pendingClinicians.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Admins</span>
                    </div>
                    <span className="font-semibold">{admins.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Registrations</CardTitle>
                  <CardDescription>Latest 5 users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={
                          user.role === "admin" ? "destructive" :
                          user.role === "clinician" ? "default" : "secondary"
                        }>
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({users?.length || 0})</CardTitle>
                <CardDescription>Complete user list with management actions</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <TableSkeleton rows={10} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || "Unnamed"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === "admin" ? "destructive" :
                              user.role === "clinician" ? "default" : "secondary"
                            }>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.verified ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.role === "clinician" && !user.verified && (
                                <Button
                                  size="sm"
                                  onClick={() => handleVerifyClinician(user.id)}
                                  disabled={verifyClinicianMutation.isPending}
                                >
                                  Verify
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Clinicians Tab */}
          <TabsContent value="clinicians" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Clinician Verifications</CardTitle>
                <CardDescription>Review and verify clinician accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingClinicians.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">No pending clinician verifications</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>License Number</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingClinicians.map((clinician) => (
                        <TableRow key={clinician.id}>
                          <TableCell className="font-medium">{clinician.name || "Unnamed"}</TableCell>
                          <TableCell>{clinician.email}</TableCell>
                          <TableCell>{clinician.specialty || "Not specified"}</TableCell>
                          <TableCell>{clinician.licenseNumber || "Not provided"}</TableCell>
                          <TableCell>
                            {clinician.createdAt ? new Date(clinician.createdAt).toLocaleDateString() : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleVerifyClinician(clinician.id)}
                                disabled={verifyClinicianMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(clinician.id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab - System Health & Monitoring */}
          <TabsContent value="activity" className="space-y-6">
            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Health Status</CardTitle>
                <CardDescription>Real-time service monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        systemHealth?.overallStatus === "healthy" ? "bg-green-500" :
                        systemHealth?.overallStatus === "degraded" ? "bg-orange-500" : "bg-red-500"
                      }`}></div>
                      <div>
                        <p className="font-semibold">Overall System Status</p>
                        <p className="text-sm text-muted-foreground">
                          {systemHealth?.overallStatus === "healthy" && "All systems operational"}
                          {systemHealth?.overallStatus === "degraded" && "Some services experiencing issues"}
                          {systemHealth?.overallStatus === "down" && "Critical services offline"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      systemHealth?.overallStatus === "healthy" ? "outline" :
                      systemHealth?.overallStatus === "degraded" ? "secondary" : "destructive"
                    } className={
                      systemHealth?.overallStatus === "healthy" ? "bg-green-50 text-green-700 border-green-200" :
                      systemHealth?.overallStatus === "degraded" ? "bg-orange-50 text-orange-700 border-orange-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {systemHealth?.overallStatus?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>

                  {systemHealth?.metrics && systemHealth.metrics.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Service Details</h4>
                      {systemHealth.metrics.slice(0, 10).map((metric, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded border">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              metric.status === "healthy" ? "bg-green-500" :
                              metric.status === "degraded" ? "bg-orange-500" : "bg-red-500"
                            }`}></div>
                            <span className="text-sm font-medium">{metric.service}</span>
                            {metric.endpoint && (
                              <span className="text-xs text-muted-foreground">({metric.endpoint})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {metric.responseTime && (
                              <span className="text-xs text-muted-foreground">
                                {metric.responseTime}ms
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {metric.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview (Today)</CardTitle>
                <CardDescription>API usage and costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">${budgetSummary?.summary.totalCostUSD || "0.00"}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{budgetSummary?.summary.totalRequests || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Tokens</p>
                      <p className="text-2xl font-bold">{(budgetSummary?.summary.totalTokens || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {budgetSummary?.costByModule && budgetSummary.costByModule.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Cost by Module</h4>
                      <div className="space-y-2">
                        {budgetSummary.costByModule.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded border">
                            <span className="text-sm">{item.module}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{item.requestCount} requests</span>
                              <span className="text-sm font-semibold">${((item.totalCostCents || 0) / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link to="/admin/budget">
                      <Button variant="outline" className="w-full">
                        View Full Budget Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent system events and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity Log Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed activity tracking will be available in the next update
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
