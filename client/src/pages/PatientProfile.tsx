import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Shield, Bell, Settings, Activity, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PatientProfile() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch data
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.preferences.getProfile.useQuery();
  const { data: emailPrefs, isLoading: emailPrefsLoading, refetch: refetchEmailPrefs } = trpc.preferences.getEmailPreferences.useQuery();
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = trpc.preferences.getUserSettings.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.preferences.getAccountStats.useQuery();
  const { data: activities, isLoading: activitiesLoading } = trpc.preferences.getAccountActivity.useQuery({ limit: 10, offset: 0 });

  // Mutations
  const updateProfile = trpc.preferences.updateProfile.useMutation({
    onSuccess: () => {
      toast({ title: language === 'ar' ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully" });
      refetchProfile();
    },
    onError: (error) => {
      toast({ title: language === 'ar' ? "فشل تحديث الملف الشخصي" : "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const updateEmailPrefs = trpc.preferences.updateEmailPreferences.useMutation({
    onSuccess: () => {
      toast({ title: language === 'ar' ? "تم تحديث تفضيلات البريد الإلكتروني" : "Email preferences updated" });
      refetchEmailPrefs();
    },
    onError: (error) => {
      toast({ title: language === 'ar' ? "فشل تحديث التفضيلات" : "Failed to update preferences", description: error.message, variant: "destructive" });
    },
  });

  const updateSettings = trpc.preferences.updateUserSettings.useMutation({
    onSuccess: () => {
      toast({ title: language === 'ar' ? "تم تحديث الإعدادات بنجاح" : "Settings updated successfully" });
      refetchSettings();
    },
    onError: (error) => {
      toast({ title: language === 'ar' ? "فشل تحديث الإعدادات" : "Failed to update settings", description: error.message, variant: "destructive" });
    },
  });

  const changePassword = trpc.preferences.changePassword.useMutation({
    onSuccess: () => {
      toast({ title: language === 'ar' ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast({ title: language === 'ar' ? "فشل تغيير كلمة المرور" : "Failed to change password", description: error.message, variant: "destructive" });
    },
  });

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phoneNumber: profile?.phoneNumber || "",
    emergencyContactName: profile?.emergencyContactName || "",
    emergencyContact: profile?.emergencyContact || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Update form when profile loads
  if (profile && !profileForm.name && !profileLoading) {
    setProfileForm({
      name: profile.name || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
      emergencyContactName: profile.emergencyContactName || "",
      emergencyContact: profile.emergencyContact || "",
    });
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: language === 'ar' ? "كلمات المرور غير متطابقة" : "Passwords do not match", variant: "destructive" });
      return;
    }
    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleEmailPrefChange = (key: string, value: boolean | string) => {
    updateEmailPrefs.mutate({ [key]: value } as any);
  };

  const handleSettingsChange = (key: string, value: any) => {
    updateSettings.mutate({ [key]: value } as any);
  };

  if (profileLoading || emailPrefsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{language === 'ar' ? 'ملفي الشخصي' : 'My Profile'}</h1>
        <p className="text-muted-foreground mt-2">{language === 'ar' ? 'إدارة إعدادات حسابك وتفضيلاتك' : 'Manage your account settings and preferences'}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {language === 'ar' ? 'الأمان' : 'Security'}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {language === 'ar' ? 'البريد' : 'Emails'}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {language === 'ar' ? 'النشاط' : 'Activity'}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'تحديث تفاصيلك الشخصية' : 'Update your personal details'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input
                    id="phone"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  />
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{language === 'ar' ? 'جهة الاتصال في حالات الطوارئ' : 'Emergency Contact'}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">{language === 'ar' ? 'اسم جهة الاتصال في حالات الطوارئ' : 'Emergency Contact Name'}</Label>
                    <Input
                      id="emergencyContactName"
                      value={profileForm.emergencyContactName}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">{language === 'ar' ? 'هاتف جهة الاتصال في حالات الطوارئ' : 'Emergency Contact Phone'}</Label>
                    <Input
                      id="emergencyContact"
                      value={profileForm.emergencyContact}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                      placeholder="+964 XXX XXX XXXX"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Your account verification status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verified</span>
                <span className={`text-sm font-medium ${profile?.emailVerified ? "text-green-600" : "text-yellow-600"}`}>
                  {profile?.emailVerified ? "✓ Verified" : "⚠ Not Verified"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Verified</span>
                <span className={`text-sm font-medium ${profile?.phoneVerified ? "text-green-600" : "text-yellow-600"}`}>
                  {profile?.phoneVerified ? "✓ Verified" : "⚠ Not Verified"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent account activity</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{activity.activityType.replace("_", " ")}</p>
                        <p className="text-muted-foreground text-xs">
                          {activity.ipAddress} • {activity.browser}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Control which emails you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Authentication & Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="welcomeEmails" className="cursor-pointer">Welcome emails</Label>
                    <Switch
                      id="welcomeEmails"
                      checked={emailPrefs?.welcomeEmails ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("welcomeEmails", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="securityAlerts" className="cursor-pointer">Security alerts</Label>
                    <Switch
                      id="securityAlerts"
                      checked={emailPrefs?.securityAlerts ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("securityAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordResetEmails" className="cursor-pointer">Password reset emails</Label>
                    <Switch
                      id="passwordResetEmails"
                      checked={emailPrefs?.passwordResetEmails ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("passwordResetEmails", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Medical Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointmentReminders" className="cursor-pointer">Appointment reminders</Label>
                    <Switch
                      id="appointmentReminders"
                      checked={emailPrefs?.appointmentReminders ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("appointmentReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="labResultNotifications" className="cursor-pointer">Lab result notifications</Label>
                    <Switch
                      id="labResultNotifications"
                      checked={emailPrefs?.labResultNotifications ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("labResultNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="criticalLabAlerts" className="cursor-pointer">Critical lab alerts</Label>
                    <Switch
                      id="criticalLabAlerts"
                      checked={emailPrefs?.criticalLabAlerts ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("criticalLabAlerts", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Messages</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newMessageNotifications" className="cursor-pointer">New message notifications</Label>
                    <Switch
                      id="newMessageNotifications"
                      checked={emailPrefs?.newMessageNotifications ?? true}
                      onCheckedChange={(checked) => handleEmailPrefChange("newMessageNotifications", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="messageFrequency">Message notification frequency</Label>
                    <Select
                      value={emailPrefs?.messageNotificationFrequency || "instant"}
                      onValueChange={(value) => handleEmailPrefChange("messageNotificationFrequency", value)}
                    >
                      <SelectTrigger id="messageFrequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Quiet Hours</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quietHoursEnabled" className="cursor-pointer">Enable quiet hours</Label>
                    <Switch
                      id="quietHoursEnabled"
                      checked={emailPrefs?.quietHoursEnabled ?? false}
                      onCheckedChange={(checked) => handleEmailPrefChange("quietHoursEnabled", checked)}
                    />
                  </div>
                  {emailPrefs?.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quietHoursStart">Start time</Label>
                        <Input
                          id="quietHoursStart"
                          type="time"
                          value={emailPrefs?.quietHoursStart || "22:00"}
                          onChange={(e) => handleEmailPrefChange("quietHoursStart", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quietHoursEnd">End time</Label>
                        <Input
                          id="quietHoursEnd"
                          type="time"
                          value={emailPrefs?.quietHoursEnd || "08:00"}
                          onChange={(e) => handleEmailPrefChange("quietHoursEnd", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
              <CardDescription>Customize your language and timezone preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings?.language || "ar"}
                  onValueChange={(value) => handleSettingsChange("language", value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings?.timezone || "Asia/Baghdad"}
                  onValueChange={(value) => handleSettingsChange("timezone", value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Baghdad">Baghdad (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select
                  value={settings?.timeFormat || "24h"}
                  onValueChange={(value) => handleSettingsChange("timeFormat", value)}
                >
                  <SelectTrigger id="timeFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Control who can see your information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileVisibility">Profile Visibility</Label>
                <Select
                  value={settings?.profileVisibility || "doctors_only"}
                  onValueChange={(value) => handleSettingsChange("profileVisibility", value)}
                >
                  <SelectTrigger id="profileVisibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="doctors_only">Doctors Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showOnlineStatus" className="cursor-pointer">Show online status</Label>
                <Switch
                  id="showOnlineStatus"
                  checked={settings?.showOnlineStatus ?? true}
                  onCheckedChange={(checked) => handleSettingsChange("showOnlineStatus", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Your account activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Account Age</p>
                    <p className="text-2xl font-bold">{stats?.accountAge} days</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Logins</p>
                    <p className="text-2xl font-bold">{stats?.totalLogins}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="text-sm font-medium">
                      {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Failed Attempts</p>
                    <p className="text-2xl font-bold">{stats?.failedLoginAttempts}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent account actions</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium capitalize">
                            {activity.activityType.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.ipAddress} • {activity.browser || "Unknown browser"}
                          </p>
                          {activity.location && (
                            <p className="text-xs text-muted-foreground">{activity.location}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
