import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, FileText, CheckCircle, XCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/SkeletonLoader";

export default function AdminDashboard() {

  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch all users
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();
  
  // Fetch system stats
  const { data: stats, isLoading: statsLoading } = trpc.admin.getSystemStats.useQuery();

  // Mutations
  const verifyClinicianMutation = trpc.admin.verifyClinician.useMutation({
    onSuccess: () => {
      toast.success("تم التحقق من الطبيب بنجاح");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث دور المستخدم بنجاح");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم بنجاح");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleVerifyClinician = (userId: number) => {
    if (confirm("هل أنت متأكد من التحقق من هذا الطبيب؟")) {
      verifyClinicianMutation.mutate({ userId });
    }
  };

  const handleUpdateRole = (userId: number, role: "patient" | "clinician" | "admin") => {
    if (confirm(`هل أنت متأكد من تغيير دور المستخدم إلى ${role}؟`)) {
      updateUserRoleMutation.mutate({ userId, role });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      deleteUserMutation.mutate({ userId });
    }
  };

  return (
    <div className="container mx-auto py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">لوحة تحكم المسؤول</h1>
        <p className="text-muted-foreground">إدارة المستخدمين والنظام</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="clinicians">الأطباء المعلقون</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.newUsersThisMonth || 0} جديد هذا الشهر
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الأطباء المعتمدون</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.verifiedClinicians || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingClinicians || 0} في انتظار التحقق
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">جلسات التشخيص</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTriageSessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.triageSessionsToday || 0} اليوم
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الاستشارات</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalConsultations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.consultationsToday || 0} اليوم
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
              <CardDescription>آخر الأنشطة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <TableSkeleton rows={5} />
              ) : (
                <div className="space-y-4">
                  {stats?.recentActivity?.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 border-b pb-4 last:border-0">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">لا توجد أنشطة حديثة</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>جميع المستخدمين</CardTitle>
              <CardDescription>إدارة حسابات المستخدمين</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <TableSkeleton rows={10} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'clinician' ? 'secondary' : 'outline'}>
                            {user.role === 'admin' ? 'مسؤول' : user.role === 'clinician' ? 'طبيب' : 'مريض'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'clinician' && (
                            user.verified ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                معتمد
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                غير معتمد
                              </Badge>
                            )
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString('ar-IQ')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.role === 'clinician' && !user.verified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyClinician(user.id)}
                              >
                                تحقق
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateRole(user.id, user.role === 'patient' ? 'clinician' : 'patient')}
                            >
                              تغيير الدور
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              حذف
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
        <TabsContent value="clinicians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الأطباء في انتظار التحقق</CardTitle>
              <CardDescription>مراجعة طلبات التسجيل للأطباء</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <TableSkeleton rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>رقم الترخيص</TableHead>
                      <TableHead>التخصص</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.filter((u: any) => u.role === 'clinician' && !u.verified).map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.licenseNumber || 'غير محدد'}</TableCell>
                        <TableCell>{user.specialty || 'غير محدد'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleVerifyClinician(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد طلبات معلقة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
