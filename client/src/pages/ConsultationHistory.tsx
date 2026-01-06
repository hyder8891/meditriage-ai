import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Video,
  Search,
  Star,
  MessageSquare,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLogo } from "@/components/AppLogo";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

export default function ConsultationHistory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const { data: consultations, isLoading } = trpc.consultation.getMy.useQuery();
  
  const completedConsultations = consultations?.filter(
    c => c.status === 'completed'
  ) || [];
  
  const filteredConsultations = completedConsultations.filter(c => {
    if (!searchQuery) return true;
    
    const isAdmin = user?.role === 'admin';
    const otherPartyName = isAdmin
      ? ('patient' in c ? c.patient?.name : '')
      : ('doctor' in c ? c.doctor?.name : '');
    
    return (
      otherPartyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const handleViewDetails = (consultation: any) => {
    setSelectedConsultation(consultation);
    setShowDetailsDialog(true);
  };
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(isAdmin ? '/admin/dashboard' : '/patient/portal')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {language === 'ar' ? 'رجوع' : 'Back'}
              </Button>
              <AppLogo 
                href={isAdmin ? '/admin/dashboard' : '/patient/portal'} 
                size="md" 
                showText={true} 
              />
              <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
                {language === 'ar' ? 'سجل الاستشارات' : 'Consultation History'}
              </h1>
            </div>
            <UserProfileDropdown />
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={language === 'ar' ? 'ابحث في السجل...' : 'Search history...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        
        {/* Consultations List */}
        {!isLoading && filteredConsultations.length > 0 && (
          <div className="grid gap-4">
            {filteredConsultations.map((consultation) => {
              const scheduledDate = new Date(consultation.scheduledTime);
              const otherPartyInfo = isDoctor
                ? ('patient' in consultation ? consultation.patient : null)
                : ('doctor' in consultation ? consultation.doctor : null);
              const otherPartyName = otherPartyInfo?.name || 
                (language === 'ar' ? 'غير معروف' : 'Unknown');
              
              return (
                <Card 
                  key={consultation.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(consultation)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {otherPartyName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{otherPartyName}</h3>
                            <Badge className="bg-gray-100 text-gray-700">
                              {language === 'ar' ? 'مكتمل' : 'Completed'}
                            </Badge>
                            {consultation.patientRating && (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                                {consultation.patientRating}/5
                              </Badge>
                            )}
                          </div>
                          
                          {!isDoctor && ('doctor' in consultation) && (consultation.doctor as any)?.specialty && (
                            <p className="text-sm text-slate-600 mb-2">
                              {(consultation.doctor as any).specialty}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{scheduledDate.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>{consultation.duration || 0} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Video className="w-4 h-4 text-slate-400" />
                              <span>{language === 'ar' ? 'استشارة فيديو' : 'Video Consultation'}</span>
                            </div>
                          </div>
                          
                          {consultation.chiefComplaint && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-1">
                              <span className="font-medium">{language === 'ar' ? 'السبب:' : 'Reason:'}</span> {consultation.chiefComplaint}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && filteredConsultations.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {language === 'ar' ? 'لا يوجد سجل' : 'No History'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery
                  ? (language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found')
                  : (language === 'ar' ? 'لم تكمل أي استشارات بعد' : "You haven't completed any consultations yet")}
              </p>
              {!searchQuery && (
                <Button onClick={() => setLocation(isAdmin ? '/admin/dashboard' : '/patient/symptom-checker')}>
                  {language === 'ar' ? 'ابدأ استشارة' : 'Start Consultation'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تفاصيل الاستشارة' : 'Consultation Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedConsultation && (
            <div className="space-y-4">
              {/* Participant Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xl">
                  {(isDoctor
                    ? ('patient' in selectedConsultation ? selectedConsultation.patient?.name : '')
                    : ('doctor' in selectedConsultation ? selectedConsultation.doctor?.name : '')
                  )?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {isDoctor
                      ? ('patient' in selectedConsultation ? selectedConsultation.patient?.name : language === 'ar' ? 'مريض غير معروف' : 'Unknown Patient')
                      : ('doctor' in selectedConsultation ? selectedConsultation.doctor?.name : language === 'ar' ? 'طبيب غير معروف' : 'Unknown Doctor')}
                  </h3>
                  {!isDoctor && ('doctor' in selectedConsultation) && (selectedConsultation.doctor as any)?.specialty && (
                    <p className="text-sm text-slate-600">{(selectedConsultation.doctor as any).specialty}</p>
                  )}
                </div>
              </div>
              
              {/* Consultation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p className="font-medium">
                    {new Date(selectedConsultation.scheduledTime).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'المدة' : 'Duration'}</p>
                  <p className="font-medium">{selectedConsultation.duration || 0} {language === 'ar' ? 'دقيقة' : 'minutes'}</p>
                </div>
              </div>
              
              {/* Chief Complaint */}
              {selectedConsultation.chiefComplaint && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'السبب الرئيسي' : 'Chief Complaint'}</p>
                  <p className="font-medium">{selectedConsultation.chiefComplaint}</p>
                </div>
              )}
              
              {/* Diagnosis */}
              {selectedConsultation.diagnosis && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'التشخيص' : 'Diagnosis'}</p>
                  <p className="font-medium">{selectedConsultation.diagnosis}</p>
                </div>
              )}
              
              {/* Notes (Doctor only) */}
              {isDoctor && selectedConsultation.notes && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'الملاحظات' : 'Notes'}</p>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedConsultation.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Chat Transcript */}
              {selectedConsultation.chatTranscript && (
                <div>
                  <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {language === 'ar' ? 'سجل الدردشة' : 'Chat Transcript'}
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-sm text-slate-600">
                      {language === 'ar' ? 'سجل الدردشة متاح' : 'Chat transcript available'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Rating */}
              {selectedConsultation.patientRating && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'التقييم' : 'Rating'}</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= selectedConsultation.patientRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {selectedConsultation.patientFeedback && (
                    <p className="text-sm text-slate-600 mt-2">{selectedConsultation.patientFeedback}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
