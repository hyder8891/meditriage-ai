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
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function ClinicianLogin() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("demo@meditriage.ai");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);

  const adminLoginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
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
    adminLoginMutation.mutate({ username: email, password });
  };

  const handleDemoLogin = () => {
    setEmail("demo@meditriage.ai");
    setPassword("demo123");
    setIsLoading(true);
    adminLoginMutation.mutate({ 
      username: "demo@meditriage.ai", 
      password: "demo123" 
    });
  };

  // If already authenticated with Manus OAuth and is admin, redirect to dashboard
  useEffect(() => {
    if (user && user.role === 'admin' && !authLoading) {
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
              <CardDescription className="text-purple-200 text-base mt-2">
                Access your secure workspace.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-100">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@meditriage.ai"
                    className="pl-11 bg-white/5 border-purple-400/30 text-white placeholder:text-purple-300 focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-100">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-11 bg-white/5 border-purple-400/30 text-white placeholder:text-purple-300 focus:border-blue-400"
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
                  Email: <span className="text-white font-mono">demo@meditriage.ai</span>
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
