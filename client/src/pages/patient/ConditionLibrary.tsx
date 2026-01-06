import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  BookOpen,
  Search,
  Heart,
  Brain,
  Activity,
  Bone,
  Eye,
  Stethoscope,
  Loader2,
  ArrowRight,
  Info,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookMarked,
  GraduationCap
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Streamdown } from "streamdown";

function ConditionLibraryContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Categories
  const categories = [
    { id: "all", label: language === 'ar' ? 'الكل' : 'All', icon: BookOpen },
    { id: "cardiovascular", label: language === 'ar' ? 'القلب' : 'Heart', icon: Heart },
    { id: "neurological", label: language === 'ar' ? 'الأعصاب' : 'Brain', icon: Brain },
    { id: "respiratory", label: language === 'ar' ? 'التنفس' : 'Respiratory', icon: Activity },
    { id: "musculoskeletal", label: language === 'ar' ? 'العظام' : 'Bones', icon: Bone },
    { id: "ophthalmology", label: language === 'ar' ? 'العيون' : 'Eyes', icon: Eye },
    { id: "general", label: language === 'ar' ? 'عام' : 'General', icon: Stethoscope },
  ];

  // Common conditions data
  const conditions = [
    {
      id: "diabetes",
      name: language === 'ar' ? 'السكري' : 'Diabetes',
      nameAr: 'السكري',
      nameEn: 'Diabetes',
      category: "general",
      prevalence: language === 'ar' ? 'شائع جداً' : 'Very Common',
      summary: language === 'ar' 
        ? 'حالة مزمنة تؤثر على كيفية معالجة الجسم لسكر الدم'
        : 'A chronic condition affecting how your body processes blood sugar',
    },
    {
      id: "hypertension",
      name: language === 'ar' ? 'ارتفاع ضغط الدم' : 'Hypertension',
      nameAr: 'ارتفاع ضغط الدم',
      nameEn: 'Hypertension',
      category: "cardiovascular",
      prevalence: language === 'ar' ? 'شائع جداً' : 'Very Common',
      summary: language === 'ar' 
        ? 'ارتفاع مستمر في ضغط الدم يمكن أن يؤدي لمضاعفات خطيرة'
        : 'Persistent high blood pressure that can lead to serious complications',
    },
    {
      id: "asthma",
      name: language === 'ar' ? 'الربو' : 'Asthma',
      nameAr: 'الربو',
      nameEn: 'Asthma',
      category: "respiratory",
      prevalence: language === 'ar' ? 'شائع' : 'Common',
      summary: language === 'ar' 
        ? 'حالة تنفسية تسبب ضيق في الشعب الهوائية'
        : 'A respiratory condition causing airway narrowing',
    },
    {
      id: "migraine",
      name: language === 'ar' ? 'الصداع النصفي' : 'Migraine',
      nameAr: 'الصداع النصفي',
      nameEn: 'Migraine',
      category: "neurological",
      prevalence: language === 'ar' ? 'شائع' : 'Common',
      summary: language === 'ar' 
        ? 'صداع شديد متكرر مع أعراض مصاحبة'
        : 'Severe recurring headaches with accompanying symptoms',
    },
    {
      id: "arthritis",
      name: language === 'ar' ? 'التهاب المفاصل' : 'Arthritis',
      nameAr: 'التهاب المفاصل',
      nameEn: 'Arthritis',
      category: "musculoskeletal",
      prevalence: language === 'ar' ? 'شائع' : 'Common',
      summary: language === 'ar' 
        ? 'التهاب يصيب المفاصل ويسبب الألم والتيبس'
        : 'Joint inflammation causing pain and stiffness',
    },
    {
      id: "anxiety",
      name: language === 'ar' ? 'القلق' : 'Anxiety',
      nameAr: 'القلق',
      nameEn: 'Anxiety',
      category: "neurological",
      prevalence: language === 'ar' ? 'شائع جداً' : 'Very Common',
      summary: language === 'ar' 
        ? 'اضطراب نفسي يتميز بالقلق المفرط والتوتر'
        : 'Mental health disorder characterized by excessive worry and tension',
    },
    {
      id: "thyroid",
      name: language === 'ar' ? 'اضطرابات الغدة الدرقية' : 'Thyroid Disorders',
      nameAr: 'اضطرابات الغدة الدرقية',
      nameEn: 'Thyroid Disorders',
      category: "general",
      prevalence: language === 'ar' ? 'شائع' : 'Common',
      summary: language === 'ar' 
        ? 'حالات تؤثر على وظيفة الغدة الدرقية'
        : 'Conditions affecting thyroid gland function',
    },
    {
      id: "anemia",
      name: language === 'ar' ? 'فقر الدم' : 'Anemia',
      nameAr: 'فقر الدم',
      nameEn: 'Anemia',
      category: "general",
      prevalence: language === 'ar' ? 'شائع' : 'Common',
      summary: language === 'ar' 
        ? 'نقص في خلايا الدم الحمراء أو الهيموغلوبين'
        : 'Deficiency in red blood cells or hemoglobin',
    },
  ];

  // AI explanation mutation
  const explainConditionMutation = trpc.medicalAssistant.explainCondition.useMutation({
    onSuccess: (data) => {
      setSelectedCondition((prev: any) => ({
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

  // Filter conditions
  const filteredConditions = conditions.filter((condition) => {
    const matchesSearch = 
      condition.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      condition.nameAr.includes(searchQuery) ||
      condition.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || condition.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle condition selection
  const handleSelectCondition = (condition: any) => {
    setSelectedCondition(condition);
    setIsLoadingDetails(true);
    explainConditionMutation.mutate({
      conditionName: condition.nameEn,
      language: language,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'مكتبة الأمراض' : 'Condition Library'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'تعرف على الأمراض الشائعة وكيفية التعامل معها'
              : 'Learn about common conditions and how to manage them'}
          </p>
        </div>
        <BookOpen className="w-10 h-10 text-rose-500" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن مرض أو حالة...' : 'Search for a condition...'}
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
        {/* Conditions List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-slate-700">
            {language === 'ar' ? 'الأمراض الشائعة' : 'Common Conditions'}
          </h3>
          {filteredConditions.map((condition) => (
            <Card 
              key={condition.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCondition?.id === condition.id ? 'border-rose-500 bg-rose-50' : ''
              }`}
              onClick={() => handleSelectCondition(condition)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{condition.name}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">{condition.summary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {condition.prevalence}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Condition Details */}
        <div className="lg:col-span-2">
          {selectedCondition ? (
            <Card>
              <CardHeader className="bg-gradient-to-r from-rose-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedCondition.name}</CardTitle>
                    <CardDescription>{selectedCondition.summary}</CardDescription>
                  </div>
                  <Badge className="bg-rose-100 text-rose-800">
                    {selectedCondition.prevalence}
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
                ) : selectedCondition.details ? (
                  <div className="space-y-6">
                    {/* Overview */}
                    {selectedCondition.details.overview && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-rose-500" />
                          {language === 'ar' ? 'نظرة عامة' : 'Overview'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedCondition.details.overview}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Symptoms */}
                    {selectedCondition.details.symptoms && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          {language === 'ar' ? 'الأعراض' : 'Symptoms'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedCondition.details.symptoms.map((symptom: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              <span className="text-sm text-slate-700">{symptom}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Causes */}
                    {selectedCondition.details.causes && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          {language === 'ar' ? 'الأسباب' : 'Causes'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedCondition.details.causes}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Treatment */}
                    {selectedCondition.details.treatment && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {language === 'ar' ? 'العلاج' : 'Treatment'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedCondition.details.treatment}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Prevention */}
                    {selectedCondition.details.prevention && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          {language === 'ar' ? 'الوقاية' : 'Prevention'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm">
                          <Streamdown>{selectedCondition.details.prevention}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* When to See Doctor */}
                    {selectedCondition.details.whenToSeeDoctor && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          {language === 'ar' ? 'متى تراجع الطبيب' : 'When to See a Doctor'}
                        </h4>
                        <div className="prose prose-slate max-w-none text-sm text-red-700">
                          <Streamdown>{selectedCondition.details.whenToSeeDoctor}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      <Button onClick={() => setLocation('/patient/find-doctors')}>
                        <Stethoscope className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'استشر طبيب' : 'Consult a Doctor'}
                      </Button>
                      <Button variant="outline" onClick={() => setLocation('/symptom-checker')}>
                        <Activity className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'فحص الأعراض' : 'Check Symptoms'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BookMarked className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>{language === 'ar' ? 'لا توجد تفاصيل متاحة' : 'No details available'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  {language === 'ar' ? 'اختر حالة للتعرف عليها' : 'Select a condition to learn about'}
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

export default function ConditionLibrary() {
  return (
    <PatientLayout>
      <ConditionLibraryContent />
    </PatientLayout>
  );
}
