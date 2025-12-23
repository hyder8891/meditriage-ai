import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";

export default function AdminTraining() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be an admin to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/admin")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Construction className="h-8 w-8 text-yellow-500" />
            <div>
              <CardTitle>AI Training Module</CardTitle>
              <CardDescription>
                This feature is currently under development
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The AI training module for the BRAIN diagnostic system will allow you to:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Upload medical training materials</li>
            <li>• Train the AI model on new data</li>
            <li>• Monitor training progress and metrics</li>
            <li>• Manage training sessions</li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            This feature will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
