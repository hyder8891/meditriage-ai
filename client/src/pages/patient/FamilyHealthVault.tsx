import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users,
  Plus,
  User,
  Heart,
  FileText,
  Pill,
  Activity,
  Calendar,
  Edit,
  Trash2,
  ChevronRight,
  Baby,
  PersonStanding,
  UserCircle,
  AlertCircle,
  CheckCircle2,
  Upload,
  Download,
  Share2,
  Lock,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";

function FamilyHealthVaultContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for new member
  const [newMember, setNewMember] = useState({
    name: "",
    relationship: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: "",
    conditions: "",
  });

  // Queries
  const familyMembersQuery = trpc.familyVault.getMembers.useQuery();
  const addMemberMutation = trpc.familyVault.addMember.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تمت إضافة فرد العائلة' : 'Family member added');
      setIsAddDialogOpen(false);
      setNewMember({ name: "", relationship: "", dateOfBirth: "", bloodType: "", allergies: "", conditions: "" });
      familyMembersQuery.refetch();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? 'فشل الإضافة' : 'Failed to add member');
    },
  });

  // Relationships
  const relationships = [
    { value: "spouse", label: language === 'ar' ? 'زوج/زوجة' : 'Spouse' },
    { value: "child", label: language === 'ar' ? 'ابن/ابنة' : 'Child' },
    { value: "parent", label: language === 'ar' ? 'والد/والدة' : 'Parent' },
    { value: "sibling", label: language === 'ar' ? 'أخ/أخت' : 'Sibling' },
    { value: "grandparent", label: language === 'ar' ? 'جد/جدة' : 'Grandparent' },
    { value: "other", label: language === 'ar' ? 'أخرى' : 'Other' },
  ];

  // Blood types
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Get relationship icon
  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case "child": return Baby;
      case "spouse": return Heart;
      case "parent": return PersonStanding;
      default: return UserCircle;
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle add member
  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.relationship) {
      toast.error(language === 'ar' ? 'الرجاء إدخال الاسم والعلاقة' : 'Please enter name and relationship');
      return;
    }
    addMemberMutation.mutate({
      name: newMember.name,
      relationship: newMember.relationship,
      dateOfBirth: newMember.dateOfBirth || undefined,
      bloodType: newMember.bloodType || undefined,
      allergies: newMember.allergies ? newMember.allergies.split(',').map(a => a.trim()) : [],
      conditions: newMember.conditions ? newMember.conditions.split(',').map(c => c.trim()) : [],
    });
  };

  // Sample family members (if no data from API)
  const familyMembers = familyMembersQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'خزنة صحة العائلة' : 'Family Health Vault'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'إدارة السجلات الصحية لأفراد عائلتك'
              : 'Manage health records for your family members'}
          </p>
        </div>
        <Users className="w-10 h-10 text-rose-500" />
      </div>

      {/* Add Member Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-rose-500 hover:bg-rose-600">
            <Plus className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'إضافة فرد' : 'Add Family Member'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إضافة فرد جديد' : 'Add New Family Member'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'أدخل معلومات فرد العائلة'
                : 'Enter family member information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'الاسم *' : 'Name *'}</Label>
              <Input
                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'العلاقة *' : 'Relationship *'}</Label>
              <Select 
                value={newMember.relationship} 
                onValueChange={(v) => setNewMember({ ...newMember, relationship: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={language === 'ar' ? 'اختر العلاقة' : 'Select relationship'} />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>{rel.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</Label>
              <Input
                type="date"
                value={newMember.dateOfBirth}
                onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'فصيلة الدم' : 'Blood Type'}</Label>
              <Select 
                value={newMember.bloodType} 
                onValueChange={(v) => setNewMember({ ...newMember, bloodType: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={language === 'ar' ? 'اختر فصيلة الدم' : 'Select blood type'} />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'الحساسيات (مفصولة بفاصلة)' : 'Allergies (comma separated)'}</Label>
              <Input
                placeholder={language === 'ar' ? 'مثال: البنسلين، الفول السوداني' : 'e.g., Penicillin, Peanuts'}
                value={newMember.allergies}
                onChange={(e) => setNewMember({ ...newMember, allergies: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الأمراض المزمنة (مفصولة بفاصلة)' : 'Chronic Conditions (comma separated)'}</Label>
              <Input
                placeholder={language === 'ar' ? 'مثال: السكري، ضغط الدم' : 'e.g., Diabetes, Hypertension'}
                value={newMember.conditions}
                onChange={(e) => setNewMember({ ...newMember, conditions: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {addMemberMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Family Members Grid */}
      {familyMembersQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : familyMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {language === 'ar' ? 'لا يوجد أفراد عائلة' : 'No Family Members Yet'}
            </h3>
            <p className="text-slate-500 mb-4">
              {language === 'ar' 
                ? 'أضف أفراد عائلتك لإدارة سجلاتهم الصحية'
                : 'Add your family members to manage their health records'}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-rose-500 hover:bg-rose-600">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة أول فرد' : 'Add First Member'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member: any) => {
            const RelIcon = getRelationshipIcon(member.relationship);
            return (
              <Card 
                key={member.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMember?.id === member.id ? 'border-rose-500 bg-rose-50' : ''
                }`}
                onClick={() => setSelectedMember(member)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-lg">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{member.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <RelIcon className="w-4 h-4" />
                        <span>{relationships.find(r => r.value === member.relationship)?.label || member.relationship}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                    {member.bloodType && (
                      <Badge variant="secondary" className="text-xs">
                        <Heart className="w-3 h-3 mr-1" />
                        {member.bloodType}
                      </Badge>
                    )}
                    {member.allergies?.length > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {member.allergies.length} {language === 'ar' ? 'حساسية' : 'allergies'}
                      </Badge>
                    )}
                    {member.conditions?.length > 0 && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                        <Activity className="w-3 h-3 mr-1" />
                        {member.conditions.length} {language === 'ar' ? 'حالة' : 'conditions'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Member Details */}
      {selectedMember && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-rose-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-rose-100 text-rose-600 text-xl">
                    {getInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedMember.name}</CardTitle>
                  <CardDescription>
                    {relationships.find(r => r.value === selectedMember.relationship)?.label}
                    {selectedMember.dateOfBirth && ` • ${new Date(selectedMember.dateOfBirth).toLocaleDateString()}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">
                  {language === 'ar' ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="records">
                  {language === 'ar' ? 'السجلات' : 'Records'}
                </TabsTrigger>
                <TabsTrigger value="medications">
                  {language === 'ar' ? 'الأدوية' : 'Medications'}
                </TabsTrigger>
                <TabsTrigger value="appointments">
                  {language === 'ar' ? 'المواعيد' : 'Appointments'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'فصيلة الدم' : 'Blood Type'}</p>
                    <p className="font-medium">{selectedMember.bloodType || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'العمر' : 'Age'}</p>
                    <p className="font-medium">
                      {selectedMember.dateOfBirth 
                        ? Math.floor((Date.now() - new Date(selectedMember.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الحساسيات' : 'Allergies'}</p>
                    <p className="font-medium">{selectedMember.allergies?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الحالات' : 'Conditions'}</p>
                    <p className="font-medium">{selectedMember.conditions?.length || 0}</p>
                  </div>
                </div>

                {/* Allergies */}
                {selectedMember.allergies?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      {language === 'ar' ? 'الحساسيات' : 'Allergies'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.allergies.map((allergy: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-orange-600 border-orange-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {selectedMember.conditions?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      {language === 'ar' ? 'الأمراض المزمنة' : 'Chronic Conditions'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.conditions.map((condition: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-blue-600 border-blue-200">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="records" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>{language === 'ar' ? 'لا توجد سجلات بعد' : 'No records yet'}</p>
                  <Button variant="outline" className="mt-4">
                    <Upload className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'رفع سجل' : 'Upload Record'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="medications" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <Pill className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>{language === 'ar' ? 'لا توجد أدوية مسجلة' : 'No medications recorded'}</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة دواء' : 'Add Medication'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="appointments" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>{language === 'ar' ? 'لا توجد مواعيد' : 'No appointments'}</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة موعد' : 'Add Appointment'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Security Note */}
      <Card className="bg-green-50 border-green-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-700">
              <p className="font-medium mb-1">
                {language === 'ar' ? 'بياناتك محمية' : 'Your Data is Protected'}
              </p>
              <p>
                {language === 'ar' 
                  ? 'جميع البيانات الصحية لعائلتك مشفرة ومحمية. أنت وحدك من يمكنه الوصول إليها.'
                  : 'All your family health data is encrypted and protected. Only you can access it.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FamilyHealthVault() {
  return (
    <PatientLayout>
      <FamilyHealthVaultContent />
    </PatientLayout>
  );
}
