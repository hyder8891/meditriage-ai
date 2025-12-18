import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Hospital,
  ArrowLeft,
  Search,
  Phone,
  Clock,
  AlertCircle,
  Navigation,
  Star,
  Globe,
  MapPinned,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface FacilityWithDistance {
  id: number;
  name: string;
  type: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  hours?: string | null;
  rating?: string | null;
  services?: string | null;
  specialties?: string | null;
  website?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  distance?: number;
}

export default function CareLocator() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [facilityType, setFacilityType] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  const { data: facilities, isLoading, refetch } = trpc.clinical.searchFacilities.useQuery(
    {
      type: facilityType as any,
      city: city || undefined,
    },
    {
      enabled: false,
    }
  );

  const { data: emergencyFacilities } = trpc.clinical.getEmergencyFacilities.useQuery();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Add distance to facilities and sort
  const facilitiesWithDistance: FacilityWithDistance[] = (facilities || []).map((facility: any) => {
    let distance: number | undefined;
    if (userLocation && facility.latitude && facility.longitude) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(facility.latitude),
        parseFloat(facility.longitude)
      );
    }
    return { ...facility, distance };
  }).sort((a: FacilityWithDistance, b: FacilityWithDistance) => {
    if (sortBy === 'distance') {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return a.distance - b.distance;
    } else {
      const ratingA = parseFloat(a.rating || '0');
      const ratingB = parseFloat(b.rating || '0');
      return ratingB - ratingA;
    }
  });

  const handleSearch = () => {
    refetch();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hospital": return "bg-red-600";
      case "clinic": return "bg-blue-600";
      case "emergency": return "bg-orange-600";
      case "specialist": return "bg-purple-600";
      default: return "bg-gray-600";
    }
  };

  const isOpenNow = (hours?: string | null): boolean | null => {
    if (!hours) return null;
    
    // Simple check for "24/7" or "Open 24 hours"
    if (hours.toLowerCase().includes('24') || hours.toLowerCase().includes('24/7')) {
      return true;
    }
    
    // For more complex hours, would need proper parsing
    // For now, return null (unknown)
    return null;
  };

  const getDirections = (facility: FacilityWithDistance) => {
    if (facility.latitude && facility.longitude) {
      // Use coordinates for more accurate directions
      const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
      window.open(url, '_blank');
    } else {
      // Fallback to address search
      const address = encodeURIComponent(`${facility.name}, ${facility.address}, ${facility.city || ''}, Iraq`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const viewOnMap = (facility: FacilityWithDistance) => {
    if (facility.latitude && facility.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`;
      window.open(url, '_blank');
    } else {
      const address = encodeURIComponent(`${facility.name}, ${facility.address}, ${facility.city || ''}, Iraq`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const iraqiCities = [
    "Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", 
    "Najaf", "Karbala", "Nasiriyah", "Amarah", "Diwaniyah",
    "Kut", "Hillah", "Ramadi", "Fallujah", "Samarra"
  ];

  const t = {
    title: language === 'ar' ? 'محدد موقع الرعاية' : 'Care Locator',
    subtitle: language === 'ar' ? 'ابحث عن المرافق الطبية في جميع أنحاء العراق' : 'Find medical facilities across Iraq',
    back: language === 'ar' ? 'رجوع' : 'Back',
    emergencyServices: language === 'ar' ? 'خدمات الطوارئ' : 'Emergency Services',
    searchFilters: language === 'ar' ? 'مرشحات البحث' : 'Search Filters',
    findNearYou: language === 'ar' ? 'ابحث عن المرافق القريبة منك' : 'Find facilities near you',
    city: language === 'ar' ? 'المدينة' : 'City',
    selectCity: language === 'ar' ? 'اختر المدينة' : 'Select city',
    facilityType: language === 'ar' ? 'نوع المرفق' : 'Facility Type',
    allTypes: language === 'ar' ? 'جميع الأنواع' : 'All Types',
    hospital: language === 'ar' ? 'مستشفى' : 'Hospital',
    clinic: language === 'ar' ? 'عيادة' : 'Clinic',
    emergencyType: language === 'ar' ? 'طوارئ' : 'Emergency',
    specialist: language === 'ar' ? 'متخصص' : 'Specialist',
    sortBy: language === 'ar' ? 'ترتيب حسب' : 'Sort By',
    distance: language === 'ar' ? 'المسافة' : 'Distance',
    rating: language === 'ar' ? 'التقييم' : 'Rating',
    searchFacilities: language === 'ar' ? 'البحث عن المرافق' : 'Search Facilities',
    quickStats: language === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats',
    totalFacilities: language === 'ar' ? 'إجمالي المرافق' : 'Total Facilities',
    emergencyCenters: language === 'ar' ? 'مراكز الطوارئ' : 'Emergency Centers',
    loading: language === 'ar' ? 'جاري التحميل...' : 'Loading facilities...',
    noFacilities: language === 'ar' ? 'لم يتم العثور على مرافق' : 'No facilities found',
    adjustFilters: language === 'ar' ? 'حاول تعديل مرشحات البحث أو اختر مدينة مختلفة' : 'Try adjusting your search filters or select a different city',
    getDirections: language === 'ar' ? 'احصل على الاتجاهات' : 'Get Directions',
    viewOnMap: language === 'ar' ? 'عرض على الخريطة' : 'View on Map',
    openNow: language === 'ar' ? 'مفتوح الآن' : 'Open Now',
    closed: language === 'ar' ? 'مغلق' : 'Closed',
    services: language === 'ar' ? 'الخدمات' : 'Services',
    website: language === 'ar' ? 'الموقع الإلكتروني' : 'Website',
    kmAway: language === 'ar' ? 'كم' : 'km away',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.back}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MapPin className="w-8 h-8 text-green-600" />
                {t.title}
              </h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Emergency Banner */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-900 font-semibold mb-2">
                  {t.emergencyServices}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <Phone className="w-4 h-4" />
                    <span>Iraqi Red Crescent: <strong>115</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <Phone className="w-4 h-4" />
                    <span>Civil Defense: <strong>115</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <Phone className="w-4 h-4" />
                    <span>Police: <strong>104</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Filters */}
          <div className="lg:col-span-1">
            <Card className="card-modern sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  {t.searchFilters}
                </CardTitle>
                <CardDescription>{t.findNearYou}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t.city}</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectCity} />
                    </SelectTrigger>
                    <SelectContent>
                      {iraqiCities.map((cityName) => (
                        <SelectItem key={cityName} value={cityName}>
                          {cityName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t.facilityType}</label>
                  <Select value={facilityType} onValueChange={setFacilityType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.allTypes} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allTypes}</SelectItem>
                      <SelectItem value="hospital">{t.hospital}</SelectItem>
                      <SelectItem value="clinic">{t.clinic}</SelectItem>
                      <SelectItem value="emergency">{t.emergencyType}</SelectItem>
                      <SelectItem value="specialist">{t.specialist}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t.sortBy}</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'distance' | 'rating')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">{t.distance}</SelectItem>
                      <SelectItem value="rating">{t.rating}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t.searchFacilities}
                </Button>

                {/* Quick Stats */}
                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t.quickStats}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.totalFacilities}</span>
                      <span className="font-semibold">{facilities?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.emergencyCenters}</span>
                      <span className="font-semibold">{emergencyFacilities?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card className="card-modern">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">{t.loading}</p>
                </CardContent>
              </Card>
            ) : facilitiesWithDistance && facilitiesWithDistance.length > 0 ? (
              facilitiesWithDistance.map((facility) => {
                const openStatus = isOpenNow(facility.hours);
                const services = facility.services ? JSON.parse(facility.services) : [];
                const specialties = facility.specialties ? JSON.parse(facility.specialties) : [];
                
                return (
                  <Card key={facility.id} className="card-modern hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="flex items-center gap-2">
                              <Hospital className="w-5 h-5 text-green-600" />
                              {facility.name}
                            </CardTitle>
                            {facility.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{facility.rating}</span>
                              </div>
                            )}
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {facility.address}, {facility.city}
                            {facility.distance && (
                              <span className="text-blue-600 font-medium ml-2">
                                ({facility.distance.toFixed(1)} {t.kmAway})
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Badge className={`${getTypeColor(facility.type)} text-white`}>
                          {facility.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        {facility.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${facility.phone}`} className="hover:text-green-600">
                              {facility.phone}
                            </a>
                          </div>
                        )}
                        {facility.hours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-600">{facility.hours}</span>
                            {openStatus !== null && (
                              openStatus ? (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t.openNow}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {t.closed}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                        {facility.website && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="w-4 h-4" />
                            <a 
                              href={facility.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-green-600 truncate"
                            >
                              {t.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Services */}
                      {services.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">{t.services}</p>
                          <div className="flex flex-wrap gap-2">
                            {services.map((service: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specialties */}
                      {specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => getDirections(facility)}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          {t.getDirections}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => viewOnMap(facility)}
                        >
                          <MapPinned className="w-4 h-4 mr-2" />
                          {t.viewOnMap}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="card-modern">
                <CardContent className="py-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">{t.noFacilities}</p>
                  <p className="text-sm text-gray-400">
                    {t.adjustFilters}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
