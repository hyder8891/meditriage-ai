import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen,
  Search,
  Loader2,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Sparkles,
  Info,
  ArrowRight,
  Filter,
  Clock,
  BookMarked,
  GraduationCap,
  Lightbulb
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Streamdown } from "streamdown";

function PatientMedicalLiteratureContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [simplifiedSummary, setSimplifiedSummary] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);

  // Popular health topics
  const popularTopics = [
    { id: "diabetes", label: language === 'ar' ? 'السكري' : 'Diabetes', query: "diabetes management patient education" },
    { id: "hypertension", label: language === 'ar' ? 'ضغط الدم' : 'Blood Pressure', query: "hypertension lifestyle management" },
    { id: "heart", label: language === 'ar' ? 'صحة القلب' : 'Heart Health', query: "cardiovascular disease prevention" },
    { id: "nutrition", label: language === 'ar' ? 'التغذية' : 'Nutrition', query: "healthy diet nutrition guidelines" },
    { id: "exercise", label: language === 'ar' ? 'الرياضة' : 'Exercise', query: "physical activity health benefits" },
    { id: "sleep", label: language === 'ar' ? 'النوم' : 'Sleep', query: "sleep quality health improvement" },
    { id: "stress", label: language === 'ar' ? 'التوتر' : 'Stress', query: "stress management mental health" },
    { id: "immunity", label: language === 'ar' ? 'المناعة' : 'Immunity', query: "immune system boost natural" },
  ];

  // Search state
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  
  // Search query
  const { data: searchData, isLoading: searchLoading, error: searchError, refetch } = trpc.ncbi.searchPubMed.useQuery(
    { query: searchTerm || "", retmax: 10 },
    { 
      enabled: !!searchTerm,
    }
  );
  
  // Handle search data changes
  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData.articles || []);
      setIsSearching(false);
      if (searchData.articles?.length === 0) {
        toast.info(language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found');
      }
    }
  }, [searchData, language]);
  
  useEffect(() => {
    if (searchError) {
      toast.error(language === 'ar' ? 'فشل البحث: ' + (searchError as any).message : 'Search failed: ' + (searchError as any).message);
      setIsSearching(false);
    }
  }, [searchError, language]);

  // Simplify mutation
  const simplifyMutation = trpc.medicalAssistant.simplifyArticle.useMutation({
    onSuccess: (data) => {
      setSimplifiedSummary(data.simplifiedSummary);
      setIsSimplifying(false);
    },
    onError: (error) => {
      toast.error(language === 'ar' ? 'فشل التبسيط' : 'Simplification failed');
      setIsSimplifying(false);
    },
  });

  // Handle search
  const handleSearch = (query?: string) => {
    const term = query || searchQuery;
    if (!term.trim()) {
      toast.error(language === 'ar' ? 'الرجاء إدخال كلمة بحث' : 'Please enter a search term');
      return;
    }
    setIsSearching(true);
    setSelectedArticle(null);
    setSimplifiedSummary("");
    setSearchTerm(term);
  };
  
  // Update results when search data changes
  React.useEffect(() => {
    if (searchData) {
      setSearchResults(searchData.articles || []);
      setIsSearching(false);
      if (searchData.articles?.length === 0) {
        toast.info(language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found');
      }
    }
  }, [searchData, language]);
  
  React.useEffect(() => {
    if (searchError) {
      toast.error(language === 'ar' ? 'فشل البحث' : 'Search failed');
      setIsSearching(false);
    }
  }, [searchError, language]);
  
  React.useEffect(() => {
    setIsSearching(searchLoading);
  }, [searchLoading]);

  // Handle article selection
  const handleSelectArticle = (article: any) => {
    setSelectedArticle(article);
    setSimplifiedSummary("");
    // Auto-simplify
    if (article.abstract) {
      setIsSimplifying(true);
      simplifyMutation.mutate({
        title: article.title,
        abstract: article.abstract,
        language: language,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'المكتبة الطبية' : 'Health Library'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'ابحث عن معلومات صحية موثوقة بلغة بسيطة'
              : 'Find reliable health information in simple language'}
          </p>
        </div>
        <BookOpen className="w-10 h-10 text-rose-500" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={language === 'ar' ? 'ابحث عن موضوع صحي...' : 'Search for a health topic...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popular Topics */}
      {!searchResults.length && !selectedArticle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-rose-500" />
              {language === 'ar' ? 'مواضيع شائعة' : 'Popular Topics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((topic) => (
                <Button
                  key={topic.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(topic.label);
                    handleSearch(topic.query);
                  }}
                  className="hover:bg-rose-50 hover:border-rose-300"
                >
                  {topic.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !selectedArticle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">
              {language === 'ar' ? `${searchResults.length} نتيجة` : `${searchResults.length} results`}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
              {language === 'ar' ? 'مسح' : 'Clear'}
            </Button>
          </div>
          
          <div className="grid gap-4">
            {searchResults.map((article, idx) => (
              <Card 
                key={idx}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleSelectArticle(article)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 line-clamp-2 mb-2">
                        {article.title}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {article.abstract?.substring(0, 200)}...
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {article.authors?.[0] && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {article.authors[0]}
                          </span>
                        )}
                        {article.pubDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.pubDate).getFullYear()}
                          </span>
                        )}
                        {article.journal && (
                          <Badge variant="secondary" className="text-xs">
                            {article.journal}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Article Detail */}
      {selectedArticle && (
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedArticle(null);
              setSimplifiedSummary("");
            }}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            {language === 'ar' ? 'العودة للنتائج' : 'Back to results'}
          </Button>

          {/* Simplified Summary */}
          {(isSimplifying || simplifiedSummary) && (
            <Card className="border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-rose-500" />
                  {language === 'ar' ? 'ملخص مبسط' : 'Simple Summary'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'شرح سهل الفهم لهذا البحث'
                    : 'Easy-to-understand explanation of this research'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSimplifying ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                    <span className="text-slate-600">
                      {language === 'ar' ? 'جاري تبسيط المحتوى...' : 'Simplifying content...'}
                    </span>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <Streamdown>{simplifiedSummary}</Streamdown>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Original Article */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{selectedArticle.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
                {selectedArticle.authors?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedArticle.authors.slice(0, 3).join(", ")}
                    {selectedArticle.authors.length > 3 && ` +${selectedArticle.authors.length - 3}`}
                  </span>
                )}
                {selectedArticle.pubDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedArticle.pubDate).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                  </span>
                )}
              </div>
              {selectedArticle.journal && (
                <Badge variant="secondary" className="mt-2">
                  {selectedArticle.journal}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    {language === 'ar' ? 'الملخص الأصلي' : 'Original Abstract'}
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedArticle.abstract || (language === 'ar' ? 'لا يوجد ملخص متاح' : 'No abstract available')}
                  </p>
                </div>

                {selectedArticle.pmid && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://pubmed.ncbi.nlm.nih.gov/${selectedArticle.pmid}`, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {language === 'ar' ? 'عرض في PubMed' : 'View on PubMed'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">
                    {language === 'ar' ? 'ملاحظة مهمة' : 'Important Note'}
                  </p>
                  <p>
                    {language === 'ar' 
                      ? 'هذه المعلومات للأغراض التعليمية فقط ولا تغني عن استشارة الطبيب. استشر طبيبك قبل اتخاذ أي قرارات صحية.'
                      : 'This information is for educational purposes only and does not replace medical advice. Consult your doctor before making any health decisions.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Tips */}
      {!searchResults.length && !selectedArticle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5 text-rose-500" />
              {language === 'ar' ? 'نصائح صحية' : 'Health Tips'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-800 mb-2">
                  {language === 'ar' ? 'تحقق من المصادر' : 'Verify Sources'}
                </h4>
                <p className="text-sm text-green-700">
                  {language === 'ar' 
                    ? 'ابحث دائماً عن معلومات من مصادر طبية موثوقة'
                    : 'Always look for information from trusted medical sources'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">
                  {language === 'ar' ? 'استشر طبيبك' : 'Consult Your Doctor'}
                </h4>
                <p className="text-sm text-blue-700">
                  {language === 'ar' 
                    ? 'ناقش ما تقرأه مع طبيبك للحصول على نصيحة شخصية'
                    : 'Discuss what you read with your doctor for personalized advice'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-2">
                  {language === 'ar' ? 'كن حذراً' : 'Be Cautious'}
                </h4>
                <p className="text-sm text-purple-700">
                  {language === 'ar' 
                    ? 'لا تعتمد على الإنترنت وحده في القرارات الصحية المهمة'
                    : 'Don\'t rely on the internet alone for important health decisions'}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h4 className="font-medium text-orange-800 mb-2">
                  {language === 'ar' ? 'ابق على اطلاع' : 'Stay Informed'}
                </h4>
                <p className="text-sm text-orange-700">
                  {language === 'ar' 
                    ? 'المعرفة الصحية تساعدك على اتخاذ قرارات أفضل'
                    : 'Health knowledge helps you make better decisions'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PatientMedicalLiterature() {
  return (
    <PatientLayout>
      <PatientMedicalLiteratureContent />
    </PatientLayout>
  );
}
