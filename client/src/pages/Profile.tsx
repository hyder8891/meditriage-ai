import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, LogOut, Calendar, FileText, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { strings } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: history, isLoading: historyLoading } = trpc.triage.history.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container max-w-4xl space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{strings.profile.notLoggedIn}</CardTitle>
            <CardDescription>{strings.login.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              {strings.profile.login}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{strings.profile.welcome}</h1>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          {strings.profile.logout}
        </Button>
      </header>

      {/* Content */}
      <main className="container py-8 max-w-4xl space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle>{user.name || 'User'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                {user.role === 'admin' && (
                  <Badge variant="secondary" className="mt-2">Admin</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Triage History */}
        <Card>
          <CardHeader>
            <CardTitle>{strings.profile.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{strings.profile.noHistory}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <Card key={record.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className={`urgency-${record.urgencyLevel.toLowerCase()}`}
                            >
                              {record.urgencyLevel}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{record.chiefComplaint}</h3>
                          <div className="flex flex-wrap gap-1">
                            {record.symptoms.slice(0, 3).map((symptom: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                            {record.symptoms.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{record.symptoms.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/record/${record.id}`)}
                        >
                          {strings.profile.viewDetails}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Link */}
        {user.role === 'admin' && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>View all triage records and system analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation('/admin')}>
                Go to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
