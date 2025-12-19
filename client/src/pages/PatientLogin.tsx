import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, UserCircle, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function PatientLogin() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { setAuth, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated (but allow admin to stay)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'clinician') {
        setLocation('/clinician/dashboard');
      } else if (user.role === 'patient') {
        setLocation('/patient/portal');
      }
      // Admin can stay on login page to login with different credentials
    }
  }, [isAuthenticated, user, setLocation]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");

  const t = {
    title: language === 'ar' ? 'دخول المريض' : 'Patient Login',
    subtitle: language === 'ar' ? 'سجل الدخول للوصول إلى بوابة المريض' : 'Sign in to access your patient portal',
    registerTitle: language === 'ar' ? 'إنشاء حساب مريض' : 'Create Patient Account',
    registerSubtitle: language === 'ar' ? 'سجل للحصول على حساب مريض جديد' : 'Register for a new patient account',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    name: language === 'ar' ? 'الاسم الكامل' : 'Full Name',
    signIn: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
    register: language === 'ar' ? 'إنشاء حساب' : 'Create Account',
    noAccount: language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?",
    haveAccount: language === 'ar' ? 'لديك حساب؟' : 'Already have an account?',
    registerLink: language === 'ar' ? 'سجل الآن' : 'Register now',
    signInLink: language === 'ar' ? 'سجل الدخول' : 'Sign in',
    backHome: language === 'ar' ? 'العودة للرئيسية' : 'Back to Home',
    forgotPassword: language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    orContinue: language === 'ar' ? 'أو تابع مع' : 'Or continue with',
  };

  const registerMutation = trpc.auth.registerPatient.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user as any);
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
      setLocation("/patient/portal");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user as any);
      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
      // Redirect based on role
      if (data.user.role === 'admin') {
        setLocation("/patient/portal"); // Admin can access patient portal
      } else {
        setLocation("/patient/portal");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!name || !email || !password) {
        toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
        return;
      }
      registerMutation.mutate({ name, email, password });
    } else {
      if (!email || !password) {
        toast.error(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MediTriage AI Pro</h1>
            <p className="text-sm text-gray-500">
              {language === 'ar' ? 'بوابة المريض' : 'Patient Portal'}
            </p>
          </div>
        </div>

        {/* Login/Register Card */}
        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-8 h-8 text-blue-600" />
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
                <div className="space-y-2">
                  <Label htmlFor="name">{t.name}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === 'ar' ? 'patient@example.com' : 'patient@example.com'}
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

              {!isRegistering && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
              >
                {isRegistering ? t.register : t.signIn}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isRegistering ? t.haveAccount : t.noAccount}{" "}
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isRegistering ? t.signInLink : t.registerLink}
                </button>
              </p>
            </div>

            {/* OAuth Options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t.orContinue}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon')}
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
                  onClick={() => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon')}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {language === 'ar' 
            ? '🔒 اتصالك آمن ومشفر'
            : '🔒 Your connection is secure and encrypted'}
        </p>
      </div>
    </div>
  );
}
