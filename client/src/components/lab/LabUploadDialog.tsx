import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LabUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabUploadDialog({ open, onOpenChange }: LabUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [reportName, setReportName] = useState("");
  const [labName, setLabName] = useState("");
  const [orderingPhysician, setOrderingPhysician] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const utils = trpc.useUtils();
  const uploadMutation = trpc.lab.uploadLabReport.useMutation();
  const processMutation = trpc.lab.processLabReport.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Invalid file type. Please upload PDF, JPG, PNG, or WEBP files.");
        return;
      }

      // Check file size (16MB max)
      if (selectedFile.size > 16 * 1024 * 1024) {
        toast.error("File size exceeds 16MB limit");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !reportDate) {
      toast.error("Please select a file and report date");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix

          // Upload the file
          const uploadResult = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64Data,
            fileType: file.type,
            reportDate,
            reportName: reportName || undefined,
            labName: labName || undefined,
            orderingPhysician: orderingPhysician || undefined,
          });

          toast.success("Lab report uploaded successfully!");
          setUploading(false);
          setProcessing(true);

          // Process the report (OCR + AI interpretation)
          await processMutation.mutateAsync({
            reportId: uploadResult.reportId,
          });

          toast.success("Lab report processed successfully!");
          
          // Refresh data
          utils.lab.getMyLabReports.invalidate();
          utils.lab.getDashboardSummary.invalidate();
          utils.lab.getMyLabResults.invalidate();

          // Reset form and close dialog
          setFile(null);
          setReportDate("");
          setReportName("");
          setLabName("");
          setOrderingPhysician("");
          setProcessing(false);
          onOpenChange(false);
        } catch (error: any) {
          console.error("Upload/processing error:", error);
          toast.error(error.message || "Failed to process lab report");
          setUploading(false);
          setProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload lab report");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Lab Report</DialogTitle>
          <DialogDescription>
            Upload your lab report (PDF or image) for AI-powered analysis
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Lab Report File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={uploading || processing}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Supported formats: PDF, JPG, PNG, WEBP (Max 16MB)
            </p>
          </div>

          {/* Report Date */}
          <div className="space-y-2">
            <Label htmlFor="reportDate">Report Date *</Label>
            <Input
              id="reportDate"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={uploading || processing}
              required
            />
          </div>

          {/* Report Name */}
          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name (Optional)</Label>
            <Input
              id="reportName"
              type="text"
              placeholder="e.g., Annual Physical Labs"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              disabled={uploading || processing}
            />
          </div>

          {/* Lab Name */}
          <div className="space-y-2">
            <Label htmlFor="labName">Laboratory Name (Optional)</Label>
            <Input
              id="labName"
              type="text"
              placeholder="e.g., Quest Diagnostics"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              disabled={uploading || processing}
            />
          </div>

          {/* Ordering Physician */}
          <div className="space-y-2">
            <Label htmlFor="physician">Ordering Physician (Optional)</Label>
            <Input
              id="physician"
              type="text"
              placeholder="e.g., Dr. Smith"
              value={orderingPhysician}
              onChange={(e) => setOrderingPhysician(e.target.value)}
              disabled={uploading || processing}
            />
          </div>

          {/* Processing Status */}
          {(uploading || processing) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {uploading ? "Uploading..." : "Processing with AI..."}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {uploading
                      ? "Uploading your lab report"
                      : "Extracting text and analyzing results. This may take 30-60 seconds."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading || processing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || !reportDate || uploading || processing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {uploading || processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
