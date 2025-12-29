import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Activity,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Smartphone } from "lucide-react";

export default function ClinicianLogin() {
  const [, setLocation] = useLocation();
  const { user, setAuth } = useAuthStore();
  const authLoading = false; // We'll handle loading state via mutation
  const [email, setEmail] = useState("demo@mydoctor.ai");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, isLoading: oauthLoading } = useFirebaseAuth('clinician', 'en');
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.success && data.token && data.user) {
        // Update auth store with token and user
        setAuth(data.token, data.user as any, data.refreshToken);
        // Also update trpc cache
        utils.auth.me.setData(undefined, data.user as any);
        toast.success("Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          setLocation("/clinician/dashboard");
        }, 1000);
      } else {
        toast.error("Invalid credentials");
        setIsLoading(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
      setIsLoading(false);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = () => {
    setEmail("demo@mydoctor.ai");
    setPassword("demo123");
    setIsLoading(true);
    loginMutation.mutate({ 
      email: "demo@mydoctor.ai", 
      password: "demo123" 
    });
  };

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'clinician') && !authLoading) {
      setLocation("/clinician/dashboard");
    }
  }, [user, authLoading, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 animate-slide-up">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Login Card */}
        <Card className="card-modern glass-strong border-blue-400/30 shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>

              <Badge 
                className="badge-modern glass cursor-pointer hover:bg-blue-500/20 transition-colors"
                onClick={handleDemoLogin}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Demo Acc
              </Badge>
            </div>

            <div>
              <CardTitle className="text-3xl text-white">Clinician Login</CardTitle>
              <CardDescription className="text-white/90 text-base mt-2">
                Access your secure workspace.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@mydoctor.ai"
                    className="pl-11 bg-white/90 border-purple-400/30 text-slate-900 placeholder:text-slate-500 focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-11 bg-white/90 border-purple-400/30 text-slate-900 placeholder:text-slate-500 focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-400/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900/50 px-2 text-purple-300">OR</span>
              </div>
            </div>

            {/* OAuth Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={signInWithGoogle}
                disabled={oauthLoading}
                className="border-purple-400/30 text-white hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              {/* Facebook login temporarily disabled - not available in useFirebaseAuth */}
            </div>
            
            {/* Manus OAuth */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full border-purple-400/30 text-white hover:bg-white/10"
            >
              Sign in with Manus OAuth
            </Button>

            {/* Create Account Link */}
            <p className="text-center text-sm text-purple-300">
              New provider?{" "}
              <button
                type="button"
                onClick={() => toast.info("Contact admin to create account")}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Create Account
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Demo Credentials Info */}
        <Card className="card-modern glass-strong border-yellow-400/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-yellow-400">Demo Credentials</p>
                <p className="text-purple-200">
                  Email: <span className="text-white font-mono">demo@mydoctor.ai</span>
                </p>
                <p className="text-purple-200">
                  Password: <span className="text-white font-mono">demo123</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
