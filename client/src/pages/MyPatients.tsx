import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, MessageCircle, Calendar, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { useLanguage } from "@/contexts/LanguageContext";

function MyPatientsContent() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "pending" | "terminated" | undefined>("active");

  const { data: patients, isLoading } = trpc.b2b2c.doctor.getMyPatients.useQuery({
    status: statusFilter,
    limit: 50,
    offset: 0,
  });

  const filteredPatients = patients?.filter(p => 
    p.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{language === 'ar' ? 'مرضاي' : 'My Patients'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة مرضاك المتصلين وسجلاتهم الطبية' : 'Manage your connected patients and their medical records'}
          </p>
        </div>
      </div>


      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن مرضى بالاسم أو البريد الإلكتروني...' : 'Search patients by name or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              {language === 'ar' ? 'نشط' : 'Active'}
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
            </Button>
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(undefined)}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Patients List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg">{language === 'ar' ? 'لم يتم العثور على مرضى' : 'No Patients Found'}</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? (language === 'ar' ? 'لا يوجد مرضى يطابقون معايير البحث' : 'No patients match your search criteria')
                : (language === 'ar' ? 'ليس لديك أي مرضى متصلين بعد' : "You don't have any connected patients yet")}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'قم بتعيين حالتك إلى "متاح" للسماح للمرضى بالاتصال بك' : 'Set your status to "Available" to allow patients to connect with you'}
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((item) => {
            const patient = item.patient;
            const relationship = item.relationship;

            if (!patient) return null;

            return (
              <Card key={relationship.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{patient.name || (language === 'ar' ? 'مريض غير مسمى' : 'Unnamed Patient')}</h3>
                        <StatusBadge status={relationship.status} />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {language === 'ar' ? 'متصل:' : 'Connected:'} {new Date(relationship.establishedAt).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                        </span>
                        {relationship.relationshipType && (
                          <Badge variant="outline" className="text-xs">
                            {relationship.relationshipType}
                          </Badge>
                        )}
                      </div>

                      {relationship.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {language === 'ar' ? 'السبب:' : 'Reason:'} {relationship.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/clinician/patients/${patient.id}`}>
                      <div className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-medium cursor-pointer transition-colors">
                        <FileText className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                      </div>
                    </Link>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/clinician/messages?patient=${patient.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'رسالة' : 'Message'}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/clinician/calendar?patient=${patient.id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'جدولة' : 'Schedule'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredPatients.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {language === 'ar' ? `عرض ${filteredPatients.length} مريض` : `Showing ${filteredPatients.length} patient${filteredPatients.length !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}

export default function MyPatients() {
  return (
    <ClinicianLayout>
      <MyPatientsContent />
    </ClinicianLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  const config: Record<string, { label: string; labelAr: string; className: string }> = {
    active: { label: "Active", labelAr: "نشط", className: "bg-green-500" },
    pending: { label: "Pending", labelAr: "قيد الانتظار", className: "bg-yellow-500" },
    inactive: { label: "Inactive", labelAr: "غير نشط", className: "bg-gray-500" },
    terminated: { label: "Terminated", labelAr: "منتهي", className: "bg-red-500" },
  };

  const statusConfig = config[status] || { label: status, labelAr: status, className: "bg-gray-500" };

  return (
    <Badge className={`${statusConfig.className} text-white text-xs`}>
      {language === 'ar' ? statusConfig.labelAr : statusConfig.label}
    </Badge>
  );
}
