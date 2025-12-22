import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Shield, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/SkeletonLoader";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Fetch all users
  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();

  // Mutations
  const verifyClinicianMutation = trpc.admin.verifyClinician.useMutation({
    onSuccess: () => {
      toast.success("تم التحقق من الطبيب بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث دور المستخدم بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Filter users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pending clinicians
  const pendingClinicians = users?.filter(
    (user) => user.role === "clinician" && !user.verified
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-teal-600" />
              إدارة المستخدمين
            </h1>
            <p className="text-slate-600 mt-1">
              إدارة حسابات المستخدمين والصلاحيات
            </p>
          </div>
        </div>

        {/* Pending Clinicians Alert */}
        {pendingClinicians && pendingClinicians.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                أطباء بانتظار التحقق ({pendingClinicians.length})
              </CardTitle>
              <CardDescription className="text-orange-700">
                يوجد أطباء بحاجة إلى التحقق من حساباتهم
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="تصفية حسب الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="patient">مريض</SelectItem>
                  <SelectItem value="clinician">طبيب</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون ({filteredUsers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التخصص</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "غير محدد"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin"
                              ? "destructive"
                              : user.role === "clinician"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {user.role === "admin"
                            ? "مدير"
                            : user.role === "clinician"
                            ? "طبيب"
                            : "مريض"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.verified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            محقق
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            غير محقق
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.specialty || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.role === "clinician" && !user.verified && (
                            <Button
                              size="sm"
                              onClick={() => verifyClinicianMutation.mutate({ userId: user.id })}
                              disabled={verifyClinicianMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              تحقق
                            </Button>
                          )}
                          <Select
                            value={user.role}
                            onValueChange={(newRole) =>
                              updateUserRoleMutation.mutate({ userId: user.id, role: newRole as any })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="patient">مريض</SelectItem>
                              <SelectItem value="clinician">طبيب</SelectItem>
                              <SelectItem value="admin">مدير</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
                                deleteUserMutation.mutate({ userId: user.id });
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  );
}
