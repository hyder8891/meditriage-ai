/**
 * ClinicCard Component
 * Displays clinic/hospital information in a beautiful card format
 * Used in AI assessment results to show nearby healthcare facilities
 */

import { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Bed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Clinic {
  id: number;
  name: string;
  nameArabic?: string | null;
  governorate: string;
  governorateArabic?: string | null;
  city: string;
  cityArabic?: string | null;
  district?: string | null;
  districtArabic?: string | null;
  phone?: string | null;
  facilityType: string;
  specialties?: string | null;
  bedCount?: number | null;
  hasEmergency?: boolean | null;
  has24Hours?: boolean | null;
}

interface ClinicCardProps {
  clinic: Clinic;
  isArabic?: boolean;
  showDetails?: boolean;
  onSelect?: (clinic: Clinic) => void;
  urgencyLevel?: 'critical' | 'urgent' | 'standard' | 'non-urgent';
}

const facilityTypeLabels: Record<string, { en: string; ar: string; color: string }> = {
  teaching_hospital: { en: 'Teaching Hospital', ar: 'مستشفى تعليمي', color: 'bg-blue-500' },
  general_hospital: { en: 'General Hospital', ar: 'مستشفى عام', color: 'bg-green-500' },
  private_hospital: { en: 'Private Hospital', ar: 'مستشفى خاص', color: 'bg-purple-500' },
  military_hospital: { en: 'Military Hospital', ar: 'مستشفى عسكري', color: 'bg-gray-600' },
  maternity_hospital: { en: 'Maternity Hospital', ar: 'مستشفى ولادة', color: 'bg-pink-500' },
  children_hospital: { en: 'Children Hospital', ar: 'مستشفى أطفال', color: 'bg-yellow-500' },
  specialized_hospital: { en: 'Specialized Hospital', ar: 'مستشفى متخصص', color: 'bg-indigo-500' },
  medical_city: { en: 'Medical City', ar: 'مدينة طبية', color: 'bg-teal-500' },
  clinic: { en: 'Clinic', ar: 'عيادة', color: 'bg-cyan-500' },
  health_center: { en: 'Health Center', ar: 'مركز صحي', color: 'bg-emerald-500' },
  emergency_center: { en: 'Emergency Center', ar: 'مركز طوارئ', color: 'bg-red-500' },
};

const specialtyLabels: Record<string, { en: string; ar: string }> = {
  general_medicine: { en: 'General Medicine', ar: 'طب عام' },
  surgery: { en: 'Surgery', ar: 'جراحة' },
  internal_medicine: { en: 'Internal Medicine', ar: 'باطنية' },
  pediatrics: { en: 'Pediatrics', ar: 'أطفال' },
  cardiology: { en: 'Cardiology', ar: 'قلب' },
  orthopedics: { en: 'Orthopedics', ar: 'عظام' },
  obstetrics: { en: 'Obstetrics', ar: 'توليد' },
  gynecology: { en: 'Gynecology', ar: 'نسائية' },
  ophthalmology: { en: 'Ophthalmology', ar: 'عيون' },
  emergency: { en: 'Emergency', ar: 'طوارئ' },
  trauma: { en: 'Trauma', ar: 'إصابات' },
  oncology: { en: 'Oncology', ar: 'أورام' },
  neonatology: { en: 'Neonatology', ar: 'حديثي الولادة' },
  cardiac_surgery: { en: 'Cardiac Surgery', ar: 'جراحة قلب' },
  vascular_surgery: { en: 'Vascular Surgery', ar: 'جراحة أوعية' },
};

export function ClinicCard({ 
  clinic, 
  isArabic = true, 
  showDetails = true,
  onSelect,
  urgencyLevel 
}: ClinicCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const facilityInfo = facilityTypeLabels[clinic.facilityType] || { 
    en: clinic.facilityType, 
    ar: clinic.facilityType, 
    color: 'bg-gray-500' 
  };
  
  const name = isArabic && clinic.nameArabic ? clinic.nameArabic : clinic.name;
  const city = isArabic && clinic.cityArabic ? clinic.cityArabic : clinic.city;
  const governorate = isArabic && clinic.governorateArabic ? clinic.governorateArabic : clinic.governorate;
  const district = isArabic && clinic.districtArabic ? clinic.districtArabic : clinic.district;
  
  let specialties: string[] = [];
  if (clinic.specialties) {
    try {
      specialties = JSON.parse(clinic.specialties);
    } catch {
      specialties = [];
    }
  }
  
  const handleCall = () => {
    if (clinic.phone) {
      window.location.href = `tel:${clinic.phone}`;
    }
  };
  
  const handleDirections = () => {
    const query = encodeURIComponent(`${clinic.name}, ${clinic.city}, Iraq`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };
  
  return (
    <Card 
      className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
        urgencyLevel === 'critical' ? 'border-red-500 border-2' : 
        urgencyLevel === 'urgent' ? 'border-orange-500 border-2' : 
        'border-border'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
              {name}
            </CardTitle>
            {isArabic && clinic.name && (
              <p className="text-sm text-muted-foreground mt-1">{clinic.name}</p>
            )}
          </div>
          <Badge className={`${facilityInfo.color} text-white shrink-0`}>
            {isArabic ? facilityInfo.ar : facilityInfo.en}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            {district && `${district}، `}{city}، {governorate}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {clinic.hasEmergency && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {isArabic ? 'طوارئ' : 'Emergency'}
            </Badge>
          )}
          {clinic.has24Hours && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {isArabic ? '24 ساعة' : '24 Hours'}
            </Badge>
          )}
          {clinic.bedCount && clinic.bedCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <Bed className="h-3 w-3" />
              {clinic.bedCount} {isArabic ? 'سرير' : 'beds'}
            </Badge>
          )}
        </div>
        
        {showDetails && specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specialties.slice(0, expanded ? undefined : 3).map((specialty, index) => {
              const label = specialtyLabels[specialty];
              return (
                <Badge key={index} variant="outline" className="text-xs">
                  {label ? (isArabic ? label.ar : label.en) : specialty}
                </Badge>
              );
            })}
            {!expanded && specialties.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setExpanded(true)}
              >
                +{specialties.length - 3} {isArabic ? 'المزيد' : 'more'}
              </Button>
            )}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {clinic.phone && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
              {isArabic ? 'اتصال' : 'Call'}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={handleDirections}
          >
            <MapPin className="h-4 w-4" />
            {isArabic ? 'الاتجاهات' : 'Directions'}
          </Button>
          {onSelect && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-1"
              onClick={() => onSelect(clinic)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ClinicFinderCardProps {
  governorate: string;
  governorateArabic?: string;
  city?: string;
  clinics: Clinic[];
  isArabic?: boolean;
  urgencyLevel?: 'critical' | 'urgent' | 'standard' | 'non-urgent';
  onViewAll?: () => void;
}

export function ClinicFinderCard({
  governorate,
  governorateArabic,
  city,
  clinics,
  isArabic = true,
  urgencyLevel,
  onViewAll,
}: ClinicFinderCardProps) {
  const urgencyColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-950',
    urgent: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
    standard: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    'non-urgent': 'border-green-500 bg-green-50 dark:bg-green-950',
  };
  
  const urgencyLabels = {
    critical: { en: 'Seek Immediate Care', ar: 'اطلب الرعاية الفورية' },
    urgent: { en: 'Visit Soon', ar: 'قم بالزيارة قريباً' },
    standard: { en: 'Schedule a Visit', ar: 'حدد موعداً' },
    'non-urgent': { en: 'Consider a Checkup', ar: 'فكر في فحص طبي' },
  };
  
  return (
    <Card 
      className={`overflow-hidden ${urgencyLevel ? urgencyColors[urgencyLevel] : ''} border-2`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {isArabic ? 'البحث عن عيادة' : 'Find a Clinic'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isArabic ? governorateArabic || governorate : governorate}
              {city && ` - ${city}`}
            </p>
          </div>
        </div>
        
        {urgencyLevel && (
          <Badge 
            variant={urgencyLevel === 'critical' ? 'destructive' : 'secondary'}
            className="mt-2 w-fit"
          >
            {isArabic ? urgencyLabels[urgencyLevel].ar : urgencyLabels[urgencyLevel].en}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {clinics.slice(0, 3).map((clinic) => (
            <div 
              key={clinic.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/80 border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">
                  {isArabic && clinic.nameArabic ? clinic.nameArabic : clinic.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {clinic.hasEmergency && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {isArabic ? 'طوارئ' : 'ER'}
                    </span>
                  )}
                  {clinic.bedCount && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {clinic.bedCount}
                    </span>
                  )}
                </div>
              </div>
              {clinic.phone && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => window.location.href = `tel:${clinic.phone}`}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {clinics.length > 3 && onViewAll && (
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={onViewAll}
          >
            {isArabic ? `عرض جميع العيادات (${clinics.length})` : `View All Clinics (${clinics.length})`}
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        
        {clinics.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            {isArabic ? 'لم يتم العثور على عيادات في منطقتك' : 'No clinics found in your area'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ClinicCard;
