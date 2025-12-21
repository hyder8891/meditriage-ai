import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Briefcase, Mail, Lock, ArrowLeft, Eye, EyeOff, Shield, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { SMSLogin } from "@/components/SMSLogin";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

export default function ClinicianLoginNew() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { setAuth, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'clinician' || user.role === 'admin') {
        // Both clinicians and admins go to clinician dashboard
        setLocation('/clinician/dashboard');
      } else if (user.role === 'patient') {
        setLocation('/patient/portal');
      }
    }
  }, [isAuthenticated, user, setLocation]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [showSMSLogin, setShowSMSLogin] = useState(false);
  const { signInWithGoogle, signInWithApple, signInWithEmail, registerWithEmail, isLoading: oauthLoading } = useFirebaseAuth('clinician', language as 'en' | 'ar');

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

  // Firebase authentication handles success/error via useFirebaseAuth hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!name || !email || !password || !licenseNumber || !specialty) {
        toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
        return;
      }
      // Note: Firebase doesn't support custom fields during registration
      // We'll need to add licenseNumber and specialty to the database after Firebase auth
      await registerWithEmail(email, password, name);
      toast.info(language === 'ar' ? 'يرجى إكمال ملفك الشخصي' : 'Please complete your profile');
      // Redirect will happen automatically via useEffect after auth state updates
    } else {
      if (!email || !password) {
        toast.error(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
        return;
      }
      await signInWithEmail(email, password);
      // Redirect will happen automatically via useEffect after auth state updates
    }
  };

  // Show SMS login if toggled
  if (showSMSLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => setShowSMSLogin(false)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'العودة لتسجيل الدخول بالبريد' : 'Back to Email Login'}
          </Button>
          
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
          
          <SMSLogin role="clinician" />
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">My Doctor طبيبي</h1>
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

            {!isRegistering && (
              <>
                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {language === 'ar' ? 'أو تابع مع' : 'Or continue with'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSMSLogin(true)}
                    className="w-full"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    {language === 'ar' ? 'SMS' : 'SMS'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={signInWithGoogle}
                    disabled={oauthLoading}
                    className="w-full"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={signInWithApple}
                    disabled={oauthLoading}
                    className="w-full"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
              </>
            )}
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
