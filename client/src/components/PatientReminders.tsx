import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bell, Clock, Pill, CheckCircle2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PatientRemindersProps {
  patientId: number;
  hoursAhead?: number;
}

export function PatientReminders({ patientId, hoursAhead = 24 }: PatientRemindersProps) {
  const { language } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  const { data: reminders, refetch } = trpc.clinical.getUpcomingReminders.useQuery({
    patientId,
    hoursAhead,
  });

  const updateAdherenceMutation = trpc.clinical.updateMedicationAdherence.useMutation({
    onSuccess: () => {
      refetch();
      toast.success(language === 'ar' ? 'تم تحديث الالتزام' : 'Adherence updated');
    },
  });

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleMarkTaken = (reminder: any) => {
    updateAdherenceMutation.mutate({
      prescriptionId: reminder.prescriptionId,
      patientId,
      taken: true,
      takenAt: new Date(),
      scheduledTime: reminder.scheduledTime,
    });
  };

  const handleMarkMissed = (reminder: any) => {
    updateAdherenceMutation.mutate({
      prescriptionId: reminder.prescriptionId,
      patientId,
      taken: false,
      scheduledTime: reminder.scheduledTime,
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = (scheduledTime: Date) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes <= 30 && diffMinutes > 0;
  };

  const isPast = (scheduledTime: Date) => {
    return new Date(scheduledTime) < new Date();
  };

  const t = {
    title: language === 'ar' ? 'تذكيرات الأدوية' : 'Medication Reminders',
    description: language === 'ar' ? 'الجرعات القادمة خلال 24 ساعة' : 'Upcoming doses in the next 24 hours',
    noReminders: language === 'ar' ? 'لا توجد تذكيرات قادمة' : 'No upcoming reminders',
    markTaken: language === 'ar' ? 'تم الأخذ' : 'Mark Taken',
    markMissed: language === 'ar' ? 'فائت' : 'Missed',
    upcoming: language === 'ar' ? 'قريباً' : 'Upcoming',
    overdue: language === 'ar' ? 'متأخر' : 'Overdue',
    showAll: language === 'ar' ? 'عرض الكل' : 'Show All',
    showLess: language === 'ar' ? 'عرض أقل' : 'Show Less',
    instructions: language === 'ar' ? 'التعليمات' : 'Instructions',
  };

  if (!reminders || reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t.noReminders}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayReminders = showAll ? reminders : reminders.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayReminders.map((reminder: any) => (
            <div
              key={reminder.id}
              className={`p-4 border rounded-lg ${
                isUpcoming(reminder.scheduledTime)
                  ? 'border-orange-300 bg-orange-50'
                  : isPast(reminder.scheduledTime)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{reminder.medicationName}</h4>
                    {isUpcoming(reminder.scheduledTime) && (
                      <Badge className="bg-orange-100 text-orange-700">{t.upcoming}</Badge>
                    )}
                    {isPast(reminder.scheduledTime) && !reminder.taken && (
                      <Badge className="bg-red-100 text-red-700">{t.overdue}</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(reminder.scheduledTime)} at {formatTime(reminder.scheduledTime)}</span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Dosage:</span> {reminder.dosage}
                  </p>
                  
                  {reminder.instructions && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t.instructions}:</span> {reminder.instructions}
                    </p>
                  )}
                </div>
                
                {!reminder.taken && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkTaken(reminder)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updateAdherenceMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {t.markTaken}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkMissed(reminder)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={updateAdherenceMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t.markMissed}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {reminders.length > 5 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? t.showLess : t.showAll} ({reminders.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
