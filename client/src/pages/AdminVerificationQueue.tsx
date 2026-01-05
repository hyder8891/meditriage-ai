import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Stethoscope,
  Eye,
  FileText,
  User,
  Calendar,
  Building,
  GraduationCap,
  Loader2,
  ExternalLink
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminVerificationQueue() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_more_info" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [additionalInfoRequested, setAdditionalInfoRequested] = useState("");
  
  // Query
  const { data, isLoading, refetch } = trpc.doctorVerification.getPendingRequests.useQuery({
    status: selectedTab as any,
    limit: 50,
    offset: 0,
  });
  
  // Mutation
  const reviewMutation = trpc.doctorVerification.reviewRequest.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
      setRejectionReason("");
      setAdditionalInfoRequested("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Check admin access
  if (user && user.role !== "admin" && user.role !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "under_review":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><Loader2 className="w-3 h-3" /> Under Review</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case "requires_more_info":
        return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600"><AlertCircle className="w-3 h-3" /> More Info</Badge>;
      default:
        return null;
    }
  };
  
  const handleReview = async () => {
    if (!selectedRequest || !reviewAction) return;
    
    await reviewMutation.mutateAsync({
      requestId: selectedRequest.request.id,
      action: reviewAction,
      notes: reviewNotes || undefined,
      rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
      additionalInfoRequested: reviewAction === "request_more_info" ? additionalInfoRequested : undefined,
    });
  };
  
  const openReviewDialog = (request: any, action: "approve" | "reject" | "request_more_info") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setShowReviewDialog(true);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
              Doctor Verification Queue
            </h1>
            <p className="text-muted-foreground">Review and approve doctor verification requests</p>
          </div>
          
          {data?.counts && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.counts.pending}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.counts.underReview}</div>
                <div className="text-muted-foreground">In Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.counts.approved}</div>
                <div className="text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.counts.rejected}</div>
                <div className="text-muted-foreground">Rejected</div>
              </div>
            </div>
          )}
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="requires_more_info">Needs Info</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : data?.requests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No requests found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data?.requests.map((item) => (
                  <Card key={item.request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{item.request.fullName}</h3>
                              <p className="text-sm text-muted-foreground">{item.user?.email || item.user?.phoneNumber}</p>
                            </div>
                            {getStatusBadge(item.request.status)}
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Stethoscope className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Specialty:</span>
                              <span className="font-medium">{item.request.specialty || "Not specified"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">License:</span>
                              <span className="font-medium">{item.request.medicalLicenseNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Authority:</span>
                              <span className="font-medium">{item.request.licenseIssuingAuthority}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">School:</span>
                              <span className="font-medium">{item.request.medicalSchool || "Not specified"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Experience:</span>
                              <span className="font-medium">{item.request.yearsOfExperience ? `${item.request.yearsOfExperience} years` : "Not specified"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Submitted:</span>
                              <span className="font-medium">{new Date(item.request.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Documents */}
                          <div className="flex gap-2 mt-4">
                            {item.request.nationalIdDocumentUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={item.request.nationalIdDocumentUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4 mr-1" /> National ID
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            )}
                            {item.request.medicalLicenseDocumentUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={item.request.medicalLicenseDocumentUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4 mr-1" /> License
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            )}
                            {item.request.medicalDegreeDocumentUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={item.request.medicalDegreeDocumentUrl} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4 mr-1" /> Degree
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {(item.request.status === "pending" || item.request.status === "under_review") && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openReviewDialog(item, "approve")}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openReviewDialog(item, "reject")}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openReviewDialog(item, "request_more_info")}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" /> Need Info
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approve" && "Approve Verification Request"}
                {reviewAction === "reject" && "Reject Verification Request"}
                {reviewAction === "request_more_info" && "Request Additional Information"}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === "approve" && "This will verify the doctor and grant them full platform access."}
                {reviewAction === "reject" && "Please provide a reason for rejection."}
                {reviewAction === "request_more_info" && "Specify what additional information is needed."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedRequest && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">{selectedRequest.request.fullName}</p>
                  <p className="text-sm text-muted-foreground">License: {selectedRequest.request.medicalLicenseNumber}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Review Notes (optional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this review..."
                />
              </div>
              
              {reviewAction === "reject" && (
                <div className="space-y-2">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    required
                  />
                </div>
              )}
              
              {reviewAction === "request_more_info" && (
                <div className="space-y-2">
                  <Label>Information Needed *</Label>
                  <Textarea
                    value={additionalInfoRequested}
                    onChange={(e) => setAdditionalInfoRequested(e.target.value)}
                    placeholder="Specify what additional documents or information is required..."
                    required
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleReview}
                disabled={reviewMutation.isPending || (reviewAction === "reject" && !rejectionReason) || (reviewAction === "request_more_info" && !additionalInfoRequested)}
                className={
                  reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" :
                  reviewAction === "reject" ? "bg-red-600 hover:bg-red-700" :
                  ""
                }
              >
                {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {reviewAction === "approve" && "Approve"}
                {reviewAction === "reject" && "Reject"}
                {reviewAction === "request_more_info" && "Request Info"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
