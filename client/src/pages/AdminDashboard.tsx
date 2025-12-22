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
import { AppLogo } from "@/components/AppLogo";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();
  
  // Fetch system stats
  const { data: stats, isLoading: statsLoading } = trpc.admin.getSystemStats.useQuery();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
          <Link href="/admin/users">
            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
              <Users className="w-4 h-4 mr-2" />
              Manage All Users
            </Button>
          </Link>
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
            {/* Stats Cards */}
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
                  <TableSkeleton rows={10} columns={5} />
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

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
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
    </div>
  );
}
