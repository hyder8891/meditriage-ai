import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Circle, MessageCircle, Calendar, FileText, Plus } from "lucide-react";
import { Link } from "wouter";
import { PatientLayout } from "@/components/PatientLayout";
import { useLanguage } from "@/contexts/LanguageContext";

function MyDoctorsContent() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { data: doctors, isLoading } = trpc.b2b2c.patient.getMyDoctors.useQuery();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isArabic ? 'أطبائي' : 'My Doctors'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'الأطباء المتصلون معك للاستشارات' : 'Doctors you\'re connected with for consultations'}
          </p>
        </div>
        

      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !doctors || doctors.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <User className="h-16 w-16 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {isArabic ? 'لا يوجد أطباء متصلون' : 'No Connected Doctors'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isArabic ? 'لم تتصل بأي طبيب بعد. ابحث عن الأطباء المتاحين لبدء الاستشارات.' : 'You haven\'t connected with any doctors yet. Find available doctors to start consultations.'}
              </p>
            </div>

          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {doctors.map((item) => {
            const doctor = item.doctor;
            const relationship = item.relationship;

            if (!doctor) return null;

            const isAvailable = doctor.availabilityStatus === "available";
            const isBusy = doctor.availabilityStatus === "busy";

            return (
              <Card key={relationship.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Doctor Info Section */}
                  <div className="flex gap-4 flex-1">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{doctor.name || "Dr. Unknown"}</h3>
                        <AvailabilityBadge status={doctor.availabilityStatus || "offline"} />
                      </div>
                      
                      {doctor.specialty && (
                        <p className="text-sm font-medium text-primary">{doctor.specialty}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>
                          Connected: {new Date(relationship.establishedAt).toLocaleDateString()}
                        </span>
                        {doctor.licenseNumber && (
                          <span>License: {doctor.licenseNumber}</span>
                        )}
                      </div>

                      {relationship.notes && (
                        <div className="text-sm bg-muted p-2 rounded">
                          <span className="font-medium">Initial reason:</span> {relationship.notes}
                        </div>
                      )}

                      {isBusy && doctor.currentPatientCount && (
                        <p className="text-sm text-yellow-600">
                          Currently with {doctor.currentPatientCount} patient{doctor.currentPatientCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Section - Stack on mobile, column on desktop */}
                  <div className="flex flex-col gap-2 sm:ml-4 w-full sm:w-auto sm:min-w-[140px]">
                    <Link to="/patient/messages" className="w-full">
                      <div
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 w-full cursor-pointer transition-colors ${
                          isAvailable 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {isAvailable ? "Message Now" : isBusy ? "Doctor Busy" : "Offline"}
                      </div>
                    </Link>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      My Records
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {doctors && doctors.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {isArabic 
            ? `متصل مع ${doctors.length} ${doctors.length === 1 ? 'طبيب' : 'أطباء'}`
            : `Connected with ${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  );
}

export default function MyDoctors() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  return (
    <PatientLayout title={isArabic ? 'أطبائي' : 'My Doctors'}>
      <MyDoctorsContent />
    </PatientLayout>
  );
}

function AvailabilityBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    available: { label: "Available Now", color: "bg-green-500" },
    busy: { label: "Busy", color: "bg-yellow-500" },
    offline: { label: "Offline", color: "bg-gray-500" },
  };

  const { label, color } = config[status] || { label: "Unknown", color: "bg-gray-500" };

  return (
    <Badge className={`${color} text-white text-xs`}>
      <Circle className="h-2 w-2 mr-1 fill-current" />
      {label}
    </Badge>
  );
}
