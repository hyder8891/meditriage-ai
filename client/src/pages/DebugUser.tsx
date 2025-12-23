import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DebugUser() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const { data: conversations } = trpc.b2b2c.messaging.getConversations.useQuery();
  const { data: myDoctors } = trpc.b2b2c.patient.getMyDoctors.useQuery();

  if (isLoading) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug: Current User</h1>
        <Button onClick={() => setLocation("/")}>Back to Home</Button>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">User Information</h2>
        {user ? (
          <div className="space-y-2 font-mono text-sm">
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Role:</strong> {user.role}</div>
          </div>
        ) : (
          <div className="text-red-600">❌ NOT LOGGED IN</div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Conversations</h2>
        {conversations && conversations.length > 0 ? (
          <div className="space-y-2">
            <div>Found {conversations.length} conversations:</div>
            {conversations.map((conv: any, i: number) => (
              <div key={i} className="p-2 bg-muted rounded font-mono text-sm">
                <div>Other User: {conv.otherUser?.name || 'Unknown'} (ID: {conv.otherUser?.id})</div>
                <div>Latest: {conv.latestMessage?.content?.substring(0, 50)}...</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-yellow-600">⚠️ NO CONVERSATIONS FOUND</div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">My Doctors</h2>
        {myDoctors && myDoctors.length > 0 ? (
          <div className="space-y-2">
            <div>Found {myDoctors.length} doctors:</div>
            {myDoctors.map((item: any, i: number) => (
              <div key={i} className="p-2 bg-muted rounded font-mono text-sm">
                <div>Doctor: {item.doctor?.name || 'Unknown'} (ID: {item.doctor?.id})</div>
                <div>Status: {item.relationship?.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-yellow-600">⚠️ NO DOCTORS FOUND</div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Expected Values</h2>
        <div className="space-y-2 font-mono text-sm">
          <div><strong>Expected User ID:</strong> 3150028</div>
          <div><strong>Expected Email:</strong> patient.test@mydoctor.com</div>
          <div><strong>Expected Messages:</strong> 3</div>
          <div><strong>Expected Doctors:</strong> 2</div>
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
    </div>
  );
}
