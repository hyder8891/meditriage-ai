import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Briefcase, Mail, Lock, ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function ClinicianLoginNew() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");

  const t = {
    title: language === 'ar' ? 'دخول الطبيب' : 'Clinician Login',
    subtitle: language === 'ar' ? 'سجل الدخول للوصول إلى لوحة التحكم' : 'Sign in to access your dashboard',
    registerTitle: language === 'ar' ? 'تسجيل طبيب جديد' : 'Clinician Registration',
    registerSubtitle: language === 'ar' ? 'سجل للحصول على حساب طبيب جديد' : 'Register for a new clinician account',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    name: language === 'ar' ? 'الاسم الكامل' : 'Full Name',
    licenseNumber: language === 'ar' ? 'رقم الترخيص الطبي' : 'Medical License Number',
    specialty: language === 'ar' ? 'التخصص' : 'Specialty',
    signIn: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
    register: language === 'ar' ? 'إنشاء حساب' : 'Create Account',
    noAccount: language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?",
    haveAccount: language === 'ar' ? 'لديك حساب؟' : 'Already have an account?',
    registerLink: language === 'ar' ? 'سجل الآن' : 'Register now',
    signInLink: language === 'ar' ? 'سجل الدخول' : 'Sign in',
    backHome: language === 'ar' ? 'العودة للرئيسية' : 'Back to Home',
    forgotPassword: language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    verificationNote: language === 'ar' 
      ? 'ملاحظة: سيتم التحقق من بيانات اعتمادك الطبية قبل الموافقة على الحساب'
      : 'Note: Your medical credentials will be verified before account approval',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!name || !email || !password || !licenseNumber || !specialty) {
        toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
        return;
      }
      // Registration logic here
      toast.success(language === 'ar' ? 'تم إرسال طلبك للمراجعة' : 'Your application has been submitted for review');
      setLocation("/");
    } else {
      if (!email || !password) {
        toast.error(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
        return;
      }
      // Login logic here
      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
      setLocation("/clinician/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backHome}
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MediTriage AI Pro</h1>
            <p className="text-sm text-gray-500">
              {language === 'ar' ? 'لوحة تحكم الطبيب' : 'Clinician Dashboard'}
            </p>
          </div>
        </div>

        {/* Login/Register Card */}
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">
              {isRegistering ? t.registerTitle : t.title}
            </CardTitle>
            <CardDescription>
              {isRegistering ? t.registerSubtitle : t.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohammed'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">{t.licenseNumber}</Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder={language === 'ar' ? 'رقم الترخيص' : 'License number'}
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">{t.specialty}</Label>
                    <Input
                      id="specialty"
                      type="text"
                      placeholder={language === 'ar' ? 'الطب الباطني، الجراحة، إلخ' : 'Internal Medicine, Surgery, etc.'}
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === 'ar' ? 'doctor@hospital.iq' : 'doctor@hospital.iq'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-purple-700">{t.verificationNote}</p>
                </div>
              )}

              {!isRegistering && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg py-6"
              >
                {isRegistering ? t.register : t.signIn}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isRegistering ? t.haveAccount : t.noAccount}{" "}
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {isRegistering ? t.signInLink : t.registerLink}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {language === 'ar' 
            ? '🔒 اتصالك آمن ومشفر • للمهنيين الطبيين فقط'
            : '🔒 Secure & Encrypted • For Medical Professionals Only'}
        </p>
      </div>
    </div>
  );
}
