/**
 * EnhancedAssessmentDisplay - Comprehensive Assessment Results Display
 * 
 * Integrates:
 * - ESI (Emergency Severity Index) visualization with color-coded badges
 * - Chain-of-Thought reasoning transparency panel
 * - Image upload results display
 * - Full bilingual support (Arabic/English)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  TestTube,
  Building2,
  Phone,
  Clock,
  Shield,
  ChevronRight,
  Activity,
  Ambulance,
  Brain,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Info,
  Eye
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ESIBadge, ESILevelCard, severityToESI, type ESILevel } from "./ESIBadge";
import { ReasoningTransparencyPanel, generateReasoningSteps, type ChainOfThought } from "./ReasoningTransparencyPanel";

// ============================================================================
// Types
// ============================================================================

export interface EnhancedAssessmentResult {
  // ESI Level (1-5)
  esiLevel?: ESILevel;
  
  // Severity (maps to ESI if esiLevel not provided)
  severity: 'low' | 'moderate' | 'high' | 'critical';
  severityLabel: string;
  
  // Primary diagnosis
  primaryCondition: {
    name: string;
    confidence: number;
    briefExplanation: string;
  };
  
  // Other possible conditions
  otherConditions: Array<{
    name: string;
    confidence: number;
  }>;
  
  // Actions and recommendations
  immediateActions: string[];
  requiredTests: Array<{
    name: string;
    reason: string;
    urgency: 'routine' | 'soon' | 'urgent';
  }>;
  
  // Warning signs
  warningSignsToWatch: string[];
  
  // Chain of thought reasoning
  chainOfThought?: ChainOfThought;
  
  // Image analysis results
  imageAnalysis?: {
    imageUrl?: string;
    description: string;
    findings: string[];
    severity: 'mild' | 'moderate' | 'severe';
    confidence: number;
  };
  
  // Recommended facilities
  recommendedFacilities?: {
    clinics: any[];
    pharmacies: any[];
    hospitals: any[];
  };
}

interface EnhancedAssessmentDisplayProps {
  result: EnhancedAssessmentResult;
  onBookAppointment?: () => void;
  onCallEmergency?: () => void;
  showReasoningByDefault?: boolean;
  className?: string;
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
    label: { en: "Critical - Emergency", ar: "حرج - طوارئ" },
    description: { 
      en: "Seek immediate emergency care!", 
      ar: "اطلب الرعاية الطارئة فوراً!" 
    }
  }
};

// ============================================================================
// Component
// ============================================================================

export function EnhancedAssessmentDisplay({
  result,
  onBookAppointment,
  onCallEmergency,
  showReasoningByDefault = false,
  className
}: EnhancedAssessmentDisplayProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState("overview");
  const [showReasoning, setShowReasoning] = useState(showReasoningByDefault);
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);

  const config = severityConfig[result.severity];
  const SeverityIcon = config.icon;
  
  // Determine ESI level
  const esiLevel: ESILevel = result.esiLevel || severityToESI(result.severity);
  
  // Generate chain of thought if not provided
  const chainOfThought: ChainOfThought = result.chainOfThought || generateReasoningSteps({
    symptoms: result.immediateActions,
    differentialDiagnosis: [
      { condition: result.primaryCondition.name, probability: result.primaryCondition.confidence / 100, reasoning: result.primaryCondition.briefExplanation },
      ...result.otherConditions.map(c => ({ condition: c.name, probability: c.confidence / 100 }))
    ],
    recommendations: result.immediateActions,
    triageLevel: result.severity,
    confidence: result.primaryCondition.confidence,
  }, isArabic ? 'ar' : 'en');

  const handleCallEmergency = () => {
    if (onCallEmergency) {
      onCallEmergency();
    } else {
      window.location.href = "tel:122";
    }
  };

  return (
    <div className={cn("space-y-4 animate-in slide-in-from-bottom-4 duration-500", className)} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Emergency Banner */}
      {result.severity === 'critical' && (
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

      {/* Main Assessment Card */}
      <Card className={cn("border-2 shadow-lg overflow-hidden", config.borderColor)}>
        {/* Header with ESI Badge */}
        <div className={cn("px-6 py-4", config.bgColor)}>
          <div className="flex items-center justify-between flex-wrap gap-4">
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
            
            {/* ESI Badge */}
            <div className="flex items-center gap-2">
              <ESIBadge level={esiLevel} size="lg" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0 h-auto flex-wrap">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-3"
            >
              <Activity className="w-4 h-4 mr-2" />
              {isArabic ? "النتيجة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger 
              value="reasoning" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-3"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isArabic ? "التفكير" : "Reasoning"}
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-3"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isArabic ? "الفحوصات" : "Tests"}
            </TabsTrigger>
            {result.imageAnalysis && (
              <TabsTrigger 
                value="images" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 py-3"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {isArabic ? "الصور" : "Images"}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6 mt-0">
            {/* ESI Level Card */}
            <ESILevelCard level={esiLevel} />

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
                        {result.primaryCondition.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2">
                        {result.primaryCondition.briefExplanation}
                      </p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.primaryCondition.confidence}%
                      </div>
                      <Progress 
                        value={result.primaryCondition.confidence} 
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Other Conditions */}
            {result.otherConditions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm">
                  {isArabic ? "احتمالات أخرى" : "Other Possibilities"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.otherConditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="py-1 px-3">
                      {condition.name} ({condition.confidence}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Actions */}
            {result.immediateActions.length > 0 && (
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
                      {result.immediateActions.map((action, idx) => (
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
            {result.warningSignsToWatch.length > 0 && (
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
                      {result.warningSignsToWatch.map((sign, idx) => (
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
          </TabsContent>

          {/* Reasoning Tab */}
          <TabsContent value="reasoning" className="p-6 mt-0">
            <ReasoningTransparencyPanel 
              chainOfThought={chainOfThought}
              isExpanded={true}
            />
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="p-6 space-y-4 mt-0">
            {result.requiredTests.length > 0 ? (
              <div className="space-y-3">
                {result.requiredTests.map((test, idx) => (
                  <Card key={idx} className={cn(
                    "border",
                    test.urgency === 'urgent' && "border-red-200 bg-red-50",
                    test.urgency === 'soon' && "border-amber-200 bg-amber-50",
                    test.urgency === 'routine' && "border-gray-200 bg-gray-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <TestTube className={cn(
                            "w-5 h-5 mt-0.5",
                            test.urgency === 'urgent' && "text-red-600",
                            test.urgency === 'soon' && "text-amber-600",
                            test.urgency === 'routine' && "text-gray-600"
                          )} />
                          <div>
                            <h4 className="font-semibold text-gray-900">{test.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{test.reason}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          test.urgency === 'urgent' && "bg-red-100 text-red-700",
                          test.urgency === 'soon' && "bg-amber-100 text-amber-700",
                          test.urgency === 'routine' && "bg-gray-100 text-gray-700"
                        )}>
                          {test.urgency === 'urgent' && (isArabic ? "عاجل" : "Urgent")}
                          {test.urgency === 'soon' && (isArabic ? "قريباً" : "Soon")}
                          {test.urgency === 'routine' && (isArabic ? "روتيني" : "Routine")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isArabic ? "لا توجد فحوصات مطلوبة حالياً" : "No tests required at this time"}</p>
              </div>
            )}
          </TabsContent>

          {/* Images Tab */}
          {result.imageAnalysis && (
            <TabsContent value="images" className="p-6 space-y-4 mt-0">
              <Card className="border border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    {isArabic ? "تحليل الصورة" : "Image Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image preview */}
                  {result.imageAnalysis.imageUrl && (
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={result.imageAnalysis.imageUrl} 
                        alt="Analyzed symptom"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Analysis results */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {isArabic ? "نتائج التحليل" : "Analysis Results"}
                      </h4>
                      <Badge className={cn(
                        result.imageAnalysis.severity === 'severe' && "bg-red-100 text-red-700",
                        result.imageAnalysis.severity === 'moderate' && "bg-amber-100 text-amber-700",
                        result.imageAnalysis.severity === 'mild' && "bg-green-100 text-green-700"
                      )}>
                        {result.imageAnalysis.severity === 'severe' && (isArabic ? "شديد" : "Severe")}
                        {result.imageAnalysis.severity === 'moderate' && (isArabic ? "متوسط" : "Moderate")}
                        {result.imageAnalysis.severity === 'mild' && (isArabic ? "خفيف" : "Mild")}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700">
                      {result.imageAnalysis.description}
                    </p>

                    {result.imageAnalysis.findings.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-600">
                          {isArabic ? "النتائج المرئية" : "Visual Findings"}
                        </h5>
                        <ul className="space-y-1">
                          {result.imageAnalysis.findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Eye className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-sm text-gray-500">
                        {isArabic ? "مستوى الثقة:" : "Confidence:"}
                      </span>
                      <Progress value={result.imageAnalysis.confidence} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {result.imageAnalysis.confidence}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {onBookAppointment && (
          <Button 
            onClick={onBookAppointment}
            className="flex-1 min-w-[200px]"
          >
            <Building2 className="w-4 h-4 mr-2" />
            {isArabic ? "حجز موعد" : "Book Appointment"}
          </Button>
        )}
        {result.severity === 'critical' && (
          <Button 
            onClick={handleCallEmergency}
            variant="destructive"
            className="flex-1 min-w-[200px]"
          >
            <Phone className="w-4 h-4 mr-2" />
            {isArabic ? "اتصل بالطوارئ 122" : "Call Emergency 122"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default EnhancedAssessmentDisplay;
