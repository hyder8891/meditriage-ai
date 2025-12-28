import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function AdminLogin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        setLocation('/admin/training');
      } else {
        setLocation('/');
      }
    }
  }, [isAuthenticated, user, setLocation]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription className="mt-2">
                Medical AI Training & Management System
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This portal is restricted to authorized administrators only.
                    Please sign in with your admin credentials.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="w-full"
                  size="lg"
                >
                  Sign In as Admin
                </Button>
              </>
            ) : user?.role !== 'admin' ? (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You do not have administrator privileges. This area is restricted to admin users only.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => setLocation('/')}
                  variant="outline"
                  className="w-full"
                >
                  Return to Home
                </Button>
              </>
            ) : null}

            <div className="pt-4 border-t text-center text-sm text-muted-foreground">
              <p>Admin Features:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Upload medical training data</li>
                <li>• Train AI models on methodologies</li>
                <li>• Monitor system performance</li>
                <li>• View all triage records</li>
              </ul>
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setLocation('/admin/login/traditional')}
                  className="text-xs"
                >
                  Use traditional login (username/password)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
