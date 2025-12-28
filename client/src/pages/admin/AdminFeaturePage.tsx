import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface AdminFeaturePageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  backendRouter?: string;
  features?: string[];
}

export default function AdminFeaturePage({ 
  title, 
  description, 
  icon, 
  backendRouter,
  features = []
}: AdminFeaturePageProps) {
  const [, navigate] = useLocation();

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                {icon}
              </div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
            </div>
            <p className="text-slate-400">{description}</p>
          </div>
        </div>

        {/* Backend Integration Info */}
        {backendRouter && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Backend Integration
              </CardTitle>
              <CardDescription className="text-slate-400">
                This feature is connected to the backend router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800 p-4 rounded-lg">
                <code className="text-sm text-green-400">
                  server/routers/{backendRouter}.ts
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Available Features</CardTitle>
              <CardDescription className="text-slate-400">
                Functionality provided by this module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">UI Under Development</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              The backend infrastructure is ready. The admin interface for this feature is currently being built.
            </p>
            <Button 
              onClick={() => navigate('/admin/dashboard')}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
