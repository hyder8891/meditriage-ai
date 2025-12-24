import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Mic } from "lucide-react";
import { useLocation } from "wouter";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { SmartAudioForm } from "@/components/SmartAudioForm";
import { toast } from "sonner";

function AddPatientContent() {
  const [, setLocation] = useLocation();
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    bloodType: "",
    allergies: "",
    medicalHistory: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVoiceFieldsDetected = (fields: Record<string, string>) => {
    // Map detected fields to form data
    const updatedData = { ...formData };
    Object.keys(fields).forEach(key => {
      if (key in updatedData) {
        updatedData[key as keyof typeof formData] = fields[key];
      }
    });
    setFormData(updatedData);
    setShowVoiceInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement patient creation
    toast.success("تم إضافة المريض بنجاح", {
      description: "Patient added successfully",
    });
    setLocation("/clinician/patients");
  };

  const formFields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'select';
    placeholder?: string;
  }> = [
    { name: "name", label: "اسم المريض / Patient Name", type: "text" },
    { name: "age", label: "العمر / Age", type: "number" },
    { name: "gender", label: "الجنس / Gender", type: "select" },
    { name: "phone", label: "رقم الهاتف / Phone", type: "text" },
    { name: "email", label: "البريد الإلكتروني / Email", type: "text" },
    { name: "address", label: "العنوان / Address", type: "text" },
    { name: "bloodType", label: "فصيلة الدم / Blood Type", type: "select" },
    { name: "allergies", label: "الحساسية / Allergies", type: "text" },
    { name: "medicalHistory", label: "التاريخ الطبي / Medical History", type: "text" },
    { name: "emergencyContact", label: "جهة الاتصال للطوارئ / Emergency Contact", type: "text" },
    { name: "emergencyPhone", label: "هاتف الطوارئ / Emergency Phone", type: "text" },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/clinician/patients")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة / Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إضافة مريض جديد</h1>
            <p className="text-gray-500 mt-1">Add New Patient</p>
          </div>
        </div>

        {/* Voice Input Toggle */}
        <div className="mb-6">
          <Button
            onClick={() => setShowVoiceInput(!showVoiceInput)}
            variant={showVoiceInput ? "default" : "outline"}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            {showVoiceInput ? "إخفاء الإدخال الصوتي / Hide Voice Input" : "استخدام الإدخال الصوتي / Use Voice Input"}
          </Button>
        </div>

        {/* Voice Input Component */}
        {showVoiceInput && (
          <div className="mb-6">
            <SmartAudioForm
              fields={formFields}
              onFieldsDetected={handleVoiceFieldsDetected}
              language="ar"
            />
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>معلومات المريض / Patient Information</CardTitle>
              <CardDescription>
                أدخل تفاصيل المريض أو استخدم الإدخال الصوتي
                <br />
                Enter patient details or use voice input
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المريض / Patient Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="أحمد محمد / Ahmed Mohammed"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">العمر / Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="35"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">الجنس / Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر / Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر / Male</SelectItem>
                      <SelectItem value="female">أنثى / Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف / Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+964 770 123 4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني / Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="patient@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">فصيلة الدم / Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) => handleInputChange("bloodType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر / Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">العنوان / Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="بغداد، الكرادة / Baghdad, Karada"
                  rows={2}
                />
              </div>

              {/* Medical Information */}
              <div className="space-y-2">
                <Label htmlFor="allergies">الحساسية / Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange("allergies", e.target.value)}
                  placeholder="بنسلين، فول سوداني / Penicillin, Peanuts"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">التاريخ الطبي / Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                  placeholder="السكري، ارتفاع ضغط الدم / Diabetes, Hypertension"
                  rows={3}
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">جهة الاتصال للطوارئ / Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    placeholder="فاطمة أحمد / Fatima Ahmed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">هاتف الطوارئ / Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    placeholder="+964 771 234 5678"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  حفظ المريض / Save Patient
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/clinician/patients")}
                >
                  إلغاء / Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default function AddPatient() {
  return (
    <ClinicianLayout>
      <AddPatientContent />
    </ClinicianLayout>
  );
}
