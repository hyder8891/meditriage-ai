/**
 * StructuredOutcomePanel - Displays AI assessment results in a structured panel below chat
 * 
 * Features:
 * - Clean, concise display without references
 * - Severity indicator with visual cues
 * - Clinic/Hospital/Pharmacy recommendation cards
 * - Intelligent matching based on symptoms and required tests
 * - Full bilingual support (Arabic/English)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  TestTube,
  Pill,
  Building2,
  MapPin,
  Phone,
  Clock,
  Heart,
  Shield,
  ChevronRight,
  Activity,
  Star,
  Ambulance
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface StructuredOutcome {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  severityLabel: string;
  
  primaryCondition: {
    name: string;
    confidence: number;
    briefExplanation: string;
  };
  
  otherConditions: Array<{
    name: string;
    confidence: number;
  }>;
  
  immediateActions: string[];
  
  requiredTests: Array<{
    name: string;
    reason: string;
    urgency: 'routine' | 'soon' | 'urgent';
  }>;
  
  specialistReferral?: {
    specialty: string;
    reason: string;
  };
  
  selfCareTips: string[];
  warningSignsToWatch: string[];
  
  recommendedFacilities: {
    clinics: ClinicRecommendation[];
    pharmacies: PharmacyRecommendation[];
    hospitals: HospitalRecommendation[];
  };
}

interface ClinicRecommendation {
  id: number;
  name: string;
  nameArabic?: string;
  type: string;
  specialty?: string;
  address?: string;
  phone?: string;
  matchReason: string;
  matchScore: number;
  servicesOffered: string[];
  distance?: string;
}

interface PharmacyRecommendation {
  id: number;
  name: string;
  nameArabic?: string;
  address?: string;
  phone?: string;
  has24Hours: boolean;
  matchReason: string;
}

interface HospitalRecommendation {
  id: number;
  name: string;
  nameArabic?: string;
  type: string;
  hasEmergency: boolean;
  has24Hours: boolean;
  bedCount?: number;
  address?: string;
  phone?: string;
  matchReason: string;
  matchScore: number;
  specialties: string[];
}

interface StructuredOutcomePanelProps {
  outcome: StructuredOutcome;
  onBookAppointment?: (clinicId: number) => void;
  onCallEmergency?: () => void;
  onCallClinic?: (phone: string) => void;
}

// ============================================================================
// Severity Configuration
// ============================================================================

const severityConfig = {
  low: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    badgeClass: "bg-emerald-100 text-emerald-800",
    progressColor: "bg-emerald-500",
    label: { en: "Low Priority", ar: "أولوية منخفضة" },
    description: { 
      en: "Your condition appears non-urgent. Schedule a routine appointment.", 
      ar: "حالتك تبدو غير عاجلة. حدد موعداً روتينياً." 
    }
  },
  moderate: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    badgeClass: "bg-amber-100 text-amber-800",
    progressColor: "bg-amber-500",
    label: { en: "Moderate Priority", ar: "أولوية متوسطة" },
    description: { 
      en: "See a doctor within a few days.", 
      ar: "راجع طبيباً خلال أيام قليلة." 
    }
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    badgeClass: "bg-orange-100 text-orange-800",
    progressColor: "bg-orange-500",
    label: { en: "High Priority", ar: "أولوية عالية" },
    description: { 
      en: "Seek medical attention within 24 hours.", 
      ar: "اطلب الرعاية الطبية خلال 24 ساعة." 
    }
  },
  critical: {
    icon: Ambulance,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    badgeClass: "bg-red-100 text-red-800",
    progressColor: "bg-red-500",
    label: { en: "Critical - Emergency", ar: "حرج - طوارئ" },
    description: { 
      en: "Seek immediate emergency care!", 
      ar: "اطلب الرعاية الطارئة فوراً!" 
    }
  }
};

const urgencyColors = {
  routine: "bg-gray-100 text-gray-700",
  soon: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700"
};

// ============================================================================
// Component
// ============================================================================

export function StructuredOutcomePanel({
  outcome,
  onBookAppointment,
  onCallEmergency,
  onCallClinic
}: StructuredOutcomePanelProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState("overview");
  
  const config = severityConfig[outcome.severity];
  const SeverityIcon = config.icon;

  const handleCallEmergency = () => {
    if (onCallEmergency) {
      onCallEmergency();
    } else {
      window.location.href = "tel:122";
    }
  };

  const handleCallClinic = (phone: string) => {
    if (onCallClinic) {
      onCallClinic(phone);
    } else {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Emergency Banner */}
      {outcome.severity === 'critical' && (
        <Card className="bg-red-100 border-2 border-red-400 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-200 rounded-full animate-pulse">
                  <Ambulance className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg">
                    {isArabic ? "حالة طوارئ!" : "Emergency!"}
                  </h3>
                  <p className="text-red-700 text-sm">
                    {isArabic 
                      ? "اتصل بالطوارئ أو اذهب لأقرب مستشفى فوراً"
                      : "Call emergency services or go to nearest hospital immediately"
                    }
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCallEmergency}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                size="lg"
              >
                <Phone className="w-5 h-5" />
                {isArabic ? "اتصل 122" : "Call 122"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Panel */}
      <Card className={cn("border-2 shadow-lg overflow-hidden", config.borderColor)}>
        {/* Severity Header */}
        <div className={cn("px-6 py-4", config.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-full bg-white/50")}>
                <SeverityIcon className={cn("w-8 h-8", config.color)} />
              </div>
              <div>
                <h2 className={cn("text-xl font-bold", config.color)}>
                  {isArabic ? config.label.ar : config.label.en}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic ? config.description.ar : config.description.en}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0 h-auto">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-6 py-3"
            >
              <Activity className="w-4 h-4 mr-2" />
              {isArabic ? "النتيجة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-6 py-3"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isArabic ? "الفحوصات" : "Tests"}
            </TabsTrigger>
            <TabsTrigger 
              value="facilities" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-6 py-3"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {isArabic ? "العيادات" : "Clinics"}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6 mt-0">
            {/* Primary Condition */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "التشخيص الأولي" : "Primary Finding"}
                </h3>
              </div>
              
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">
                        {outcome.primaryCondition.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2">
                        {outcome.primaryCondition.briefExplanation}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-2xl font-bold text-blue-600">
                        {outcome.primaryCondition.confidence}%
                      </div>
                      <Progress 
                        value={outcome.primaryCondition.confidence} 
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Other Conditions */}
            {outcome.otherConditions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm">
                  {isArabic ? "احتمالات أخرى" : "Other Possibilities"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {outcome.otherConditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="py-1 px-3">
                      {condition.name} ({condition.confidence}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Actions */}
            {outcome.immediateActions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "الإجراءات المطلوبة" : "What To Do"}
                  </h3>
                </div>
                <Card className="bg-orange-50 border border-orange-200">
                  <CardContent className="p-4">
                    <ul className="space-y-2">
                      {outcome.immediateActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-orange-800">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Warning Signs */}
            {outcome.warningSignsToWatch.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "راجع الطوارئ إذا" : "Seek Emergency If"}
                  </h3>
                </div>
                <Card className="bg-red-50 border border-red-200">
                  <CardContent className="p-4">
                    <ul className="space-y-2">
                      {outcome.warningSignsToWatch.map((sign, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-red-800">{sign}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Self Care Tips */}
            {outcome.selfCareTips.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "نصائح للعناية الذاتية" : "Self Care Tips"}
                  </h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {outcome.selfCareTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="p-6 space-y-6 mt-0">
            {outcome.requiredTests.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "الفحوصات الموصى بها" : "Recommended Tests"}
                  </h3>
                </div>
                <div className="space-y-3">
                  {outcome.requiredTests.map((test, idx) => (
                    <Card key={idx} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{test.name}</h4>
                              <Badge className={urgencyColors[test.urgency]}>
                                {test.urgency === 'routine' && (isArabic ? 'روتيني' : 'Routine')}
                                {test.urgency === 'soon' && (isArabic ? 'قريباً' : 'Soon')}
                                {test.urgency === 'urgent' && (isArabic ? 'عاجل' : 'Urgent')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{test.reason}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Specialist Referral */}
                {outcome.specialistReferral && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">
                        {isArabic ? "تحويل لأخصائي" : "Specialist Referral"}
                      </h3>
                    </div>
                    <Card className="bg-purple-50 border border-purple-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-purple-900">
                          {outcome.specialistReferral.specialty}
                        </h4>
                        <p className="text-sm text-purple-700 mt-1">
                          {outcome.specialistReferral.reason}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isArabic ? "لا توجد فحوصات مطلوبة حالياً" : "No tests required at this time"}</p>
              </div>
            )}
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="p-6 space-y-6 mt-0">
            {/* Hospitals (for critical/high severity) */}
            {outcome.recommendedFacilities.hospitals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "المستشفيات الموصى بها" : "Recommended Hospitals"}
                  </h3>
                </div>
                <div className="space-y-3">
                  {outcome.recommendedFacilities.hospitals.map((hospital) => (
                    <FacilityCard
                      key={hospital.id}
                      facility={hospital}
                      type="hospital"
                      isArabic={isArabic}
                      onCall={handleCallClinic}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clinics */}
            {outcome.recommendedFacilities.clinics.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "العيادات الموصى بها" : "Recommended Clinics"}
                  </h3>
                  <Badge variant="outline" className="ml-2">
                    {isArabic ? 'مطابقة للفحوصات المطلوبة' : 'Matched to your tests'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {outcome.recommendedFacilities.clinics.map((clinic) => (
                    <FacilityCard
                      key={clinic.id}
                      facility={clinic}
                      type="clinic"
                      isArabic={isArabic}
                      onCall={handleCallClinic}
                      onBook={onBookAppointment}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {outcome.recommendedFacilities.clinics.length === 0 && 
             outcome.recommendedFacilities.hospitals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isArabic ? "لا توجد مرافق موصى بها" : "No facilities to recommend"}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="px-6 pb-6">
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              {isArabic 
                ? "⚕️ هذا التقييم للأغراض الإعلامية فقط ولا يحل محل الاستشارة الطبية. استشر طبيباً للتشخيص والعلاج."
                : "⚕️ This assessment is for informational purposes only and does not replace medical consultation. See a doctor for diagnosis and treatment."
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Facility Card Component
// ============================================================================

interface FacilityCardProps {
  facility: ClinicRecommendation | HospitalRecommendation;
  type: 'clinic' | 'hospital';
  isArabic: boolean;
  onCall: (phone: string) => void;
  onBook?: (id: number) => void;
}

function FacilityCard({ facility, type, isArabic, onCall, onBook }: FacilityCardProps) {
  const isHospital = type === 'hospital';
  const hospital = facility as HospitalRecommendation;
  const clinic = facility as ClinicRecommendation;
  
  return (
    <Card className={cn(
      "border-2 transition-all hover:shadow-md",
      isHospital ? "border-red-200 bg-red-50/50" : "border-blue-200 bg-blue-50/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">
                {isArabic ? (facility.nameArabic || facility.name) : facility.name}
              </h4>
              {facility.matchScore >= 80 && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <Star className="w-3 h-3" />
                  {isArabic ? 'تطابق عالي' : 'Best Match'}
                </Badge>
              )}
              {isHospital && hospital.hasEmergency && (
                <Badge className="bg-red-100 text-red-700">
                  {isArabic ? 'طوارئ' : 'Emergency'}
                </Badge>
              )}
              {(isHospital ? hospital.has24Hours : false) && (
                <Badge variant="outline">24/7</Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{isArabic ? 'لماذا:' : 'Why:'}</span> {facility.matchReason}
            </p>
            
            {facility.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {facility.address}
              </p>
            )}
            
            {/* Services for clinics */}
            {!isHospital && clinic.servicesOffered && clinic.servicesOffered.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {clinic.servicesOffered.slice(0, 4).map((service, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="text-right">
              <div className={cn(
                "text-lg font-bold",
                facility.matchScore >= 80 ? "text-green-600" : 
                facility.matchScore >= 60 ? "text-blue-600" : "text-gray-600"
              )}>
                {facility.matchScore}%
              </div>
              <div className="text-xs text-gray-500">
                {isArabic ? 'تطابق' : 'Match'}
              </div>
            </div>
            
            {facility.phone && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCall(facility.phone!)}
                className="gap-1"
              >
                <Phone className="w-3 h-3" />
                {isArabic ? 'اتصل' : 'Call'}
              </Button>
            )}
            
            {/* Booking feature temporarily disabled */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StructuredOutcomePanel;
