import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function DebugAuth() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.auth.debugMe.useQuery();
  const { data: conversations } = trpc.b2b2c.messaging.getConversations.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p>{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
          {data?.authenticated ? (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">✅ Authenticated</p>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="font-semibold">User ID:</span>
                  <span className="font-mono text-lg text-blue-600">{data.user?.id}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Email:</span>
                  <span>{data.user?.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Name:</span>
                  <span>{data.user?.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Role:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{data.user?.role}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">❌ Not Authenticated</p>
              <p className="text-sm text-red-600 mt-2">{data?.message}</p>
              <Button 
                onClick={() => setLocation("/patient-login")} 
                className="mt-4"
              >
                Go to Login
              </Button>
            </div>
          )}
        </Card>

        {data?.authenticated && (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Conversations</h2>
              {conversations && conversations.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-semibold">
                    ✅ Found {conversations.length} conversations
                  </p>
                  {conversations.map((conv: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded border">
                      <p><strong>With:</strong> {conv.otherUser?.name} (ID: {conv.otherUser?.id})</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Latest: {conv.latestMessage?.content?.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">⚠️ No conversations found</p>
                  <p className="text-sm text-yellow-700 mt-2">
                    This means the messages table has no records for user ID {data.user?.id}
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Expected Test Data</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Expected User ID:</strong> 3150028</p>
                <p><strong>Expected Email:</strong> patient.test@mydoctor.com</p>
                <p><strong>Expected Messages:</strong> 3</p>
                <p><strong>Expected Doctors:</strong> 2</p>
                <hr className="my-3" />
                {data.user?.id === 3150028 ? (
                  <p className="text-green-600 font-semibold">✅ User ID matches! You're logged in as the test patient.</p>
                ) : (
                  <p className="text-red-600 font-semibold">
                    ❌ User ID mismatch! You're logged in as ID {data.user?.id}, but test data is for ID 3150028.
                  </p>
                )}
              </div>
            </Card>

            <div className="flex gap-4">
              <Button onClick={() => setLocation("/patient/messages")}>
                Go to Messages
              </Button>
              <Button onClick={() => setLocation("/patient/my-doctors")}>
                Go to My Doctors
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
