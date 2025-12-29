import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { storagePut } from "@/lib/storage";

export default function Certificates() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: certificates, isLoading } = trpc.certificate.list.useQuery();
  
  const createMutation = trpc.certificate.create.useMutation({
    onSuccess: () => {
      toast.success("Certificate added successfully");
      utils.certificate.list.invalidate();
      setIsAddDialogOpen(false);
      setFormData({
        certificateType: "",
        certificateName: "",
        issuingOrganization: "",
        certificateNumber: "",
        issueDate: "",
        expiryDate: "",
        specialty: "",
        country: "",
        state: "",
        documentKey: "",
        documentUrl: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to add certificate: " + error.message);
    },
  });
  
  const deleteMutation = trpc.certificate.delete.useMutation({
    onSuccess: () => {
      toast.success("Certificate deleted successfully");
      utils.certificate.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete certificate: " + error.message);
    },
  });
  
  const [formData, setFormData] = useState({
    certificateType: "",
    certificateName: "",
    issuingOrganization: "",
    certificateNumber: "",
    issueDate: "",
    expiryDate: "",
    specialty: "",
    country: "",
    state: "",
    documentKey: "",
    documentUrl: "",
  });
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `certificates/${Date.now()}-${randomSuffix}-${file.name}`;
      
      const result = await storagePut(fileKey, buffer, file.type);
      
      setFormData(prev => ({
        ...prev,
        documentKey: result.key,
        documentUrl: result.url,
      }));
      
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "expired":
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Medical Certificates</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional medical certifications and credentials
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Certificate</DialogTitle>
              <DialogDescription>
                Enter the details of your medical certificate or credential
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateType">Certificate Type *</Label>
                  <Select
                    value={formData.certificateType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, certificateType: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical_license">Medical License</SelectItem>
                      <SelectItem value="board_certification">Board Certification</SelectItem>
                      <SelectItem value="specialty_certification">Specialty Certification</SelectItem>
                      <SelectItem value="fellowship">Fellowship</SelectItem>
                      <SelectItem value="residency">Residency Certificate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="certificateName">Certificate Name *</Label>
                  <Input
                    id="certificateName"
                    value={formData.certificateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, certificateName: e.target.value }))}
                    placeholder="e.g., Board Certified in Internal Medicine"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issuingOrganization">Issuing Organization *</Label>
                <Input
                  id="issuingOrganization"
                  value={formData.issuingOrganization}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                  placeholder="e.g., American Board of Internal Medicine"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateNumber">Certificate Number *</Label>
                  <Input
                    id="certificateNumber"
                    value={formData.certificateNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, certificateNumber: e.target.value }))}
                    placeholder="Certificate/License number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="e.g., Cardiology"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., United States"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., California"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document">Upload Certificate Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {formData.documentUrl && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || isUploading}>
                  {createMutation.isPending ? "Adding..." : "Add Certificate"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {certificates && certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your medical certificates and credentials to get started
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Certificate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates?.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {cert.certificateName}
                      {getStatusBadge(cert.verificationStatus)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {cert.issuingOrganization}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this certificate?")) {
                        deleteMutation.mutate({ id: cert.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Certificate Number</p>
                    <p className="font-medium">{cert.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="font-medium">
                      {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  {cert.expiryDate && (
                    <div>
                      <p className="text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">
                        {new Date(cert.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {cert.specialty && (
                    <div>
                      <p className="text-muted-foreground">Specialty</p>
                      <p className="font-medium">{cert.specialty}</p>
                    </div>
                  )}
                  {cert.country && (
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-medium">{cert.country}</p>
                    </div>
                  )}
                  {cert.state && (
                    <div>
                      <p className="text-muted-foreground">State</p>
                      <p className="font-medium">{cert.state}</p>
                    </div>
                  )}
                </div>
                
                {cert.documentUrl && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View Document
                      </a>
                    </Button>
                  </div>
                )}
                
                {cert.verificationNotes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Verification Notes</p>
                    <p className="text-sm text-muted-foreground">{cert.verificationNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
