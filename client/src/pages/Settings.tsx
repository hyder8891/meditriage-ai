import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, User, Bell, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { ClinicianLayout } from "@/components/ClinicianLayout";

function SettingsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user settings
  const { data: settings, refetch: refetchSettings } = trpc.preferences.getUserSettings.useQuery();
  const { data: emailPrefs, refetch: refetchEmailPrefs } = trpc.preferences.getEmailPreferences.useQuery();

  // Mutations
  const updateSettingsMutation = trpc.preferences.updateUserSettings.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات بنجاح");
      refetchSettings();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateEmailPrefsMutation = trpc.preferences.updateEmailPreferences.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ تفضيلات البريد الإلكتروني");
      refetchEmailPrefs();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = trpc.preferences.changePassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور الجديدة غير متطابقة");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-teal-600" />
          الإعدادات
        </h1>
        <p className="text-slate-600 mt-1">
          إدارة حسابك وتفضيلاتك
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4 mr-2" />
            التفضيلات
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
              <CardDescription>
                معلوماتك الشخصية الأساسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={user?.name || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>الدور</Label>
                <Input
                  value={
                    user?.role === "admin"
                      ? "مدير"
                      : user?.role === "clinician"
                      ? "طبيب"
                      : "مريض"
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تفضيلات البريد الإلكتروني</CardTitle>
              <CardDescription>
                اختر الإشعارات التي تريد استلامها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>رسائل جديدة</Label>
                  <p className="text-sm text-slate-500">
                    إشعار عند استلام رسالة جديدة
                  </p>
                </div>
                <Switch
                  checked={emailPrefs?.newMessages !== false}
                  onCheckedChange={(checked) =>
                    updateEmailPrefsMutation.mutate({
                      newMessages: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>نتائج المختبر</Label>
                  <p className="text-sm text-slate-500">
                    إشعار عند جاهزية نتائج المختبر
                  </p>
                </div>
                <Switch
                  checked={emailPrefs?.labResults !== false}
                  onCheckedChange={(checked) =>
                    updateEmailPrefsMutation.mutate({
                      labResults: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>تأكيد المواعيد</Label>
                  <p className="text-sm text-slate-500">
                    إشعار عند حجز أو تأكيد موعد
                  </p>
                </div>
                <Switch
                  checked={emailPrefs?.appointmentConfirmations !== false}
                  onCheckedChange={(checked) =>
                    updateEmailPrefsMutation.mutate({
                      appointmentConfirmations: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور</CardTitle>
              <CardDescription>
                تحديث كلمة المرور الخاصة بك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>كلمة المرور الحالية</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>تأكيد كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
              >
                حفظ كلمة المرور الجديدة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التفضيلات العامة</CardTitle>
              <CardDescription>
                تخصيص تجربتك في التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اللغة</Label>
                <Select
                  value={settings?.language || "ar"}
                  onValueChange={(value: "en" | "ar") =>
                    updateSettingsMutation.mutate({ language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المنطقة الزمنية</Label>
                <Select
                  value={settings?.timezone || "Asia/Baghdad"}
                  onValueChange={(value) =>
                    updateSettingsMutation.mutate({ timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Baghdad">بغداد (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                    <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>إظهار الملف الشخصي</Label>
                  <p className="text-sm text-slate-500">
                    السماح للآخرين برؤية ملفك الشخصي
                  </p>
                </div>
                <Switch
                  checked={settings?.profileVisibility === "public"}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ profileVisibility: checked ? "public" : "private" })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();

  // If clinician/admin, wrap with ClinicianLayout
  if (user?.role === "clinician" || user?.role === "admin") {
    return (
      <ClinicianLayout>
        <SettingsContent />
      </ClinicianLayout>
    );
  }

  // For patients, render without layout
  return <SettingsContent />;
}
