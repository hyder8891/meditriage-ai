import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Shield
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);

  const { data: allRecords, isLoading } = trpc.triage.adminGetAll.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-5 w-5" />
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate statistics
  const stats = allRecords ? {
    total: allRecords.length,
    emergency: allRecords.filter(r => r.urgencyLevel === 'EMERGENCY').length,
    urgent: allRecords.filter(r => r.urgencyLevel === 'URGENT').length,
    today: allRecords.filter(r => {
      const recordDate = new Date(r.createdAt);
      const today = new Date();
      return recordDate.toDateString() === today.toDateString();
    }).length,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/profile')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Medical Triage System Analytics</p>
          </div>
        </div>
        <Badge variant="secondary">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      </header>

      {/* Content */}
      <main className="container py-8 max-w-7xl space-y-6">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Assessments</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mr-1" />
                  All time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Today's Cases</CardDescription>
                <CardTitle className="text-3xl">{stats.today}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  Last 24 hours
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Emergency Cases</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats.emergency}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Requires immediate attention
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Urgent Cases</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{stats.urgent}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Needs prompt care
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* All Records */}
        <Card>
          <CardHeader>
            <CardTitle>All Triage Records</CardTitle>
            <CardDescription>Complete system history with patient assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !allRecords || allRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No triage records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRecords.map((record) => (
                  <Card 
                    key={record.id} 
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRecord(record.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`urgency-${record.urgencyLevel.toLowerCase()}`}
                            >
                              {record.urgencyLevel}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              User ID: {record.userId}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.createdAt).toLocaleString()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {record.language.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <h3 className="font-semibold mb-2 truncate">{record.chiefComplaint}</h3>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {record.symptoms.slice(0, 5).map((symptom: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                            {record.symptoms.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{record.symptoms.length - 5} more
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {record.assessment}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {record.messageCount} messages
                          </div>
                          {record.duration && (
                            <div>
                              {Math.floor(record.duration / 60)}m {record.duration % 60}s
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
