import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Pill,
  Search,
  Syringe,
  Scissors,
  Activity,
  Heart,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
  Sparkles,
  Stethoscope,
  FileText,
  HelpCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Streamdown } from "streamdown";

function TreatmentGuideContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Categories
  const categories = [
    { id: "all", label: language === 'ar' ? 'الكل' : 'All', icon: Activity },
    { id: "medication", label: language === 'ar' ? 'الأدوية' : 'Medications', icon: Pill },
    { id: "procedure", label: language === 'ar' ? 'الإجراءات' : 'Procedures', icon: Syringe },
    { id: "surgery", label: language === 'ar' ? 'الجراحة' : 'Surgery', icon: Scissors },
    { id: "therapy", label: language === 'ar' ? 'العلاج الطبيعي' : 'Therapy', icon: Heart },
  ];

  // Common treatments data
  const treatments = [
    {
      id: "blood-pressure-meds",
      name: language === 'ar' ? 'أدوية ضغط الدم' : 'Blood Pressure Medications',
      nameEn: 'Blood Pressure Medications',
      category: "medication",
      duration: language === 'ar' ? 'طويل الأمد' : 'Long-term',
      summary: language === 'ar' 
        ? 'أدوية للتحكم في ارتفاع ضغط الدم'
        : 'Medications to control high blood pressure',
    },
    {
      id: "diabetes-management",
      name: language === 'ar' ? 'إدارة السكري' : 'Diabetes Management',
      nameEn: 'Diabetes Management',
      category: "medication",
      duration: language === 'ar' ? 'طويل الأمد' : 'Long-term',
      summary: language === 'ar' 
        ? 'خطة شاملة للتحكم في مستوى السكر'
        : 'Comprehensive plan to control blood sugar levels',
    },
    {
      id: "physical-therapy",
      name: language === 'ar' ? 'العلاج الطبيعي' : 'Physical Therapy',
      nameEn: 'Physical Therapy',
      category: "therapy",
      duration: language === 'ar' ? '6-12 أسبوع' : '6-12 weeks',
      summary: language === 'ar' 
        ? 'تمارين لتحسين الحركة وتخفيف الألم'
        : 'Exercises to improve mobility and reduce pain',
    },
    {
      id: "mri-scan",
      name: language === 'ar' ? 'فحص الرنين المغناطيسي' : 'MRI Scan',
      nameEn: 'MRI Scan',
      category: "procedure",
      duration: language === 'ar' ? '30-60 دقيقة' : '30-60 minutes',
      summary: language === 'ar' 
        ? 'تصوير تفصيلي للأعضاء الداخلية'
        : 'Detailed imaging of internal organs',
    },
    {
      id: "endoscopy",
      name: language === 'ar' ? 'التنظير' : 'Endoscopy',
      nameEn: 'Endoscopy',
      category: "procedure",
      duration: language === 'ar' ? '15-30 دقيقة' : '15-30 minutes',
      summary: language === 'ar' 
        ? 'فحص الجهاز الهضمي بالكاميرا'
        : 'Camera examination of digestive system',
    },
    {
      id: "appendectomy",
      name: language === 'ar' ? 'استئصال الزائدة' : 'Appendectomy',
      nameEn: 'Appendectomy',
      category: "surgery",
      duration: language === 'ar' ? '1-2 ساعة' : '1-2 hours',
      summary: language === 'ar' 
        ? 'جراحة لإزالة الزائدة الدودية'
        : 'Surgery to remove the appendix',
    },
    {
      id: "knee-replacement",
      name: language === 'ar' ? 'استبدال الركبة' : 'Knee Replacement',
      nameEn: 'Knee Replacement',
      category: "surgery",
      duration: language === 'ar' ? '2-3 ساعات' : '2-3 hours',
      summary: language === 'ar' 
        ? 'جراحة لاستبدال مفصل الركبة التالف'
        : 'Surgery to replace damaged knee joint',
    },
    {
      id: "cbt-therapy",
      name: language === 'ar' ? 'العلاج السلوكي المعرفي' : 'CBT Therapy',
      nameEn: 'Cognitive Behavioral Therapy',
      category: "therapy",
      duration: language === 'ar' ? '12-20 جلسة' : '12-20 sessions',
      summary: language === 'ar' 
        ? 'علاج نفسي لتغيير أنماط التفكير السلبية'
        : 'Psychological therapy to change negative thought patterns',
    },
  ];

  // AI explanation mutation
  const explainTreatmentMutation = trpc.medicalAssistant.explainTreatment.useMutation({
    onSuccess: (data) => {
      setSelectedTreatment((prev: any) => ({
        ...prev,
        details: data,
      }));
      setIsLoadingDetails(false);
    },
    onError: (error) => {
      toast.error(language === 'ar' ? 'فشل تحميل التفاصيل' : 'Failed to load details');
      setIsLoadingDetails(false);
    },
  });

  // Filter treatments
  const filteredTreatments = treatments.filter((treatment) => {
    const matchesSearch = 
      treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      treatment.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || treatment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle treatment selection
  const handleSelectTreatment = (treatment: any) => {
    setSelectedTreatment(treatment);
    setIsLoadingDetails(true);
    explainTreatmentMutation.mutate({
      treatmentName: treatment.nameEn,
      language: language,
    });
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medication": return Pill;
      case "procedure": return Syringe;
      case "surgery": return Scissors;
      case "therapy": return Heart;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'دليل العلاجات' : 'Treatment Guide'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'تعرف على ما يمكن توقعه من العلاجات المختلفة'
              : 'Learn what to expect from different treatments'}
          </p>
        </div>
        <FileText className="w-10 h-10 text-rose-500" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن علاج...' : 'Search for a treatment...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={selectedCategory === category.id ? "bg-rose-500 hover:bg-rose-600" : ""}
          >
            <category.icon className="w-4 h-4 mr-1" />
            {category.label}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatments List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-slate-700">
            {language === 'ar' ? 'العلاجات الشائعة' : 'Common Treatments'}
          </h3>
          {filteredTreatments.map((treatment) => {
            const CategoryIcon = getCategoryIcon(treatment.category);
            return (
              <Card 
                key={treatment.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTreatment?.id === treatment.id ? 'border-rose-500 bg-rose-50' : ''
                }`}
                onClick={() => handleSelectTreatment(treatment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{treatment.name}</h4>
                        <p className="text-sm text-slate-500">{treatment.summary}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {treatment.duration}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Treatment Details */}
        <div className="lg:col-span-2">
          {selectedTreatment ? (
            <Card>
              <CardHeader className="bg-gradient-to-r from-rose-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedTreatment.name}</CardTitle>
                    <CardDescription>{selectedTreatment.summary}</CardDescription>
                  </div>
                  <Badge className="bg-rose-100 text-rose-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedTreatment.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {language === 'ar' ? 'جاري تحميل المعلومات...' : 'Loading information...'}
                      </p>
                    </div>
                  </div>
                ) : selectedTreatment.details ? (
                  <div className="space-y-6">
                    {/* What to Expect */}
                    {selectedTreatment.details.whatToExpect && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          {language === 'ar' ? 'ماذا تتوقع' : 'What to Expect'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedTreatment.details.whatToExpect}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Before Treatment */}
                    {selectedTreatment.details.beforeTreatment && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          {language === 'ar' ? 'قبل العلاج' : 'Before Treatment'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedTreatment.details.beforeTreatment}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* During Treatment */}
                    {selectedTreatment.details.duringTreatment && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-rose-500" />
                          {language === 'ar' ? 'أثناء العلاج' : 'During Treatment'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedTreatment.details.duringTreatment}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* After Treatment */}
                    {selectedTreatment.details.afterTreatment && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {language === 'ar' ? 'بعد العلاج' : 'After Treatment'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedTreatment.details.afterTreatment}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Side Effects */}
                    {selectedTreatment.details.sideEffects && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          {language === 'ar' ? 'الآثار الجانبية المحتملة' : 'Possible Side Effects'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedTreatment.details.sideEffects.map((effect: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              <span className="text-sm text-slate-700">{effect}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions to Ask */}
                    {selectedTreatment.details.questionsToAsk && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4" />
                          {language === 'ar' ? 'أسئلة لطبيبك' : 'Questions for Your Doctor'}
                        </h4>
                        <ul className="space-y-2">
                          {selectedTreatment.details.questionsToAsk.map((question: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                              <span className="font-medium">{idx + 1}.</span>
                              {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      <Button onClick={() => setLocation('/patient/find-doctors')}>
                        <Stethoscope className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'استشر طبيب' : 'Consult a Doctor'}
                      </Button>
                      <Button variant="outline" onClick={() => setLocation('/patient/second-opinion-prep')}>
                        <FileText className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'تحضير أسئلة' : 'Prepare Questions'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>{language === 'ar' ? 'لا توجد تفاصيل متاحة' : 'No details available'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  {language === 'ar' ? 'اختر علاج للتعرف عليه' : 'Select a treatment to learn about'}
                </h3>
                <p className="text-slate-500">
                  {language === 'ar' 
                    ? 'اختر من القائمة لعرض معلومات مفصلة'
                    : 'Choose from the list to view detailed information'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TreatmentGuide() {
  return (
    <PatientLayout>
      <TreatmentGuideContent />
    </PatientLayout>
  );
}
