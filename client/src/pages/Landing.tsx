import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Activity, FileText, Languages } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const { strings, language, toggleLanguage } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Disclaimer Banner */}
      <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm">
        <AlertCircle className="inline-block w-4 h-4 mr-2" />
        {strings.disclaimerBanner}
      </div>

      {/* Header */}
      <header className="container py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">{strings.title}</h1>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2"
        >
          <Languages className="w-4 h-4" />
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              {strings.title}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {strings.subtitle}
            </p>
            <Button
              size="lg"
              onClick={() => setLocation('/triage')}
              className="mt-6 text-lg px-8 py-6"
            >
              {strings.startTriage}
            </Button>
          </div>

          {/* Safety Information */}
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              {strings.landingSafety.title}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {strings.landingSafety.p1}
              <strong>{strings.landingSafety.b1}</strong>
              {strings.landingSafety.p2}
              <strong>{strings.landingSafety.b2}</strong>
            </AlertDescription>
          </Alert>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Activity className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{strings.landingFeatures.aiAnalysis.title}</CardTitle>
                <CardDescription>
                  {strings.landingFeatures.aiAnalysis.desc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{strings.landingFeatures.multimodal.title}</CardTitle>
                <CardDescription>
                  {strings.landingFeatures.multimodal.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Acknowledgment */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8">
            {strings.safetyAgreement}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {strings.title}. MVP Stage One.
      </footer>
    </div>
  );
}
