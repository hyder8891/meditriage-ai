import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  XCircle,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Building2,
  Stethoscope,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface FacilityWithDistance {
  id: string | number;
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
  photoReference?: string;
  openNow?: boolean;
  emergencyServices?: number;
}

function CareLocatorContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [facilityType, setFacilityType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  const [useRealData, setUseRealData] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [resultsLimit, setResultsLimit] = useState(50);

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
          // Default to Baghdad coordinates
          setUserLocation({ lat: 33.3152, lng: 44.3661 });
        }
      );
    } else {
      // Default to Baghdad coordinates
      setUserLocation({ lat: 33.3152, lng: 44.3661 });
    }
  }, []);

  // Query for facility statistics
  const { data: facilityStats } = trpc.clinical.getFacilityStats.useQuery();

  // Query for available cities
  const { data: availableCities } = trpc.clinical.getFacilityCities.useQuery();

  // Query for available specialties
  const { data: availableSpecialties } = trpc.clinical.getFacilitySpecialties.useQuery();

  // Query for real facilities using Google Places API
  const { data: realFacilities, isLoading: realLoading, refetch: refetchReal } = trpc.clinical.searchRealFacilities.useQuery(
    {
      query: searchQuery || undefined,
      location: userLocation || undefined,
      radius: 50000, // 50km
      type: (facilityType === "all" || !facilityType) ? undefined : facilityType as any,
    },
    {
      enabled: useRealData && !!userLocation,
    }
  );

  // Query for database facilities with enhanced filtering
  const { data: dbFacilities, isLoading: dbLoading, refetch: refetchDb } = trpc.clinical.searchFacilities.useQuery(
    {
      type: facilityType as any,
      city: selectedCity === "all" ? undefined : selectedCity,
      specialty: selectedSpecialty === "all" ? undefined : selectedSpecialty,
      searchQuery: searchQuery || undefined,
      limit: resultsLimit,
    },
    {
      enabled: !useRealData,
    }
  );

  const { data: emergencyFacilities } = trpc.clinical.getEmergencyFacilities.useQuery();

  // Fetch detailed facility information
  const fetchFacilityDetails = async (placeId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch('/api/trpc/clinical.getFacilityDetails?input=' + encodeURIComponent(JSON.stringify({ placeId })));
      const data = await response.json();
      if (data.result?.data) {
        setSelectedFacility(data.result.data);
      } else {
        throw new Error('Failed to fetch facility details');
      }
    } catch (error) {
      toast.error("Failed to load facility details");
      console.error(error);
    } finally {
      setDetailsLoading(false);
    }
  };

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

  const facilities = useRealData ? realFacilities : dbFacilities;
  const isLoading = useRealData ? realLoading : dbLoading;

  // Add distance to facilities and sort
  const facilitiesWithDistance: FacilityWithDistance[] = useMemo(() => {
    if (!facilities) return [];
    
    return (facilities || []).map((facility: any) => {
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
      } else if (sortBy === 'rating') {
        const ratingA = parseFloat(a.rating || '0');
        const ratingB = parseFloat(b.rating || '0');
        return ratingB - ratingA;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }, [facilities, userLocation, sortBy]);

  const handleSearch = () => {
    if (useRealData) {
      refetchReal();
    } else {
      refetchDb();
    }
  };

  const handleLoadMore = () => {
    setResultsLimit(prev => prev + 50);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hospital": return <Hospital className="w-5 h-5" />;
      case "clinic": return <Building2 className="w-5 h-5" />;
      case "emergency": return <Activity className="w-5 h-5" />;
      case "specialist": return <Stethoscope className="w-5 h-5" />;
      default: return <Hospital className="w-5 h-5" />;
    }
  };

  const getDirections = (facility: FacilityWithDistance) => {
    if (facility.latitude && facility.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
      window.open(url, '_blank');
    } else {
      const address = encodeURIComponent(`${facility.name}, ${facility.address}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const viewOnMap = (facility: FacilityWithDistance) => {
    if (facility.latitude && facility.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`;
      window.open(url, '_blank');
    } else {
      const address = encodeURIComponent(`${facility.name}, ${facility.address}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const t = {
    title: language === 'ar' ? 'محدد موقع الرعاية' : 'Care Locator',
    subtitle: language === 'ar' ? 'ابحث عن المرافق الطبية في جميع أنحاء العراق' : 'Find medical facilities across Iraq',
    facilitiesCount: language === 'ar' ? 'أكثر من 2000 منشأة صحية' : '2,000+ Healthcare Facilities',
    back: language === 'ar' ? 'رجوع' : 'Back',
    emergencyServices: language === 'ar' ? 'خدمات الطوارئ' : 'Emergency Services',
    searchFilters: language === 'ar' ? 'مرشحات البحث' : 'Search Filters',
    advancedFilters: language === 'ar' ? 'مرشحات متقدمة' : 'Advanced Filters',
    findNearYou: language === 'ar' ? 'ابحث عن المرافق القريبة منك' : 'Find facilities near you',
    searchPlaceholder: language === 'ar' ? 'ابحث عن المستشفيات والعيادات...' : 'Search hospitals, clinics, specialties...',
    facilityType: language === 'ar' ? 'نوع المرفق' : 'Facility Type',
    allTypes: language === 'ar' ? 'جميع الأنواع' : 'All Types',
    hospital: language === 'ar' ? 'مستشفى' : 'Hospital',
    clinic: language === 'ar' ? 'عيادة' : 'Clinic',
    emergencyType: language === 'ar' ? 'طوارئ' : 'Emergency',
    specialist: language === 'ar' ? 'متخصص' : 'Specialist',
    city: language === 'ar' ? 'المدينة' : 'City',
    allCities: language === 'ar' ? 'جميع المدن' : 'All Cities',
    specialty: language === 'ar' ? 'التخصص' : 'Specialty',
    allSpecialties: language === 'ar' ? 'جميع التخصصات' : 'All Specialties',
    sortBy: language === 'ar' ? 'ترتيب حسب' : 'Sort By',
    distance: language === 'ar' ? 'المسافة' : 'Distance',
    rating: language === 'ar' ? 'التقييم' : 'Rating',
    name: language === 'ar' ? 'الاسم' : 'Name',
    searchFacilities: language === 'ar' ? 'البحث عن المرافق' : 'Search Facilities',
    useRealData: language === 'ar' ? 'استخدام بيانات حقيقية' : 'Use Real Data',
    quickStats: language === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats',
    totalFacilities: language === 'ar' ? 'إجمالي المرافق' : 'Total Facilities',
    hospitals: language === 'ar' ? 'المستشفيات' : 'Hospitals',
    clinics: language === 'ar' ? 'العيادات' : 'Clinics',
    emergencyCenters: language === 'ar' ? 'مراكز الطوارئ' : 'Emergency Centers',
    specialists: language === 'ar' ? 'المتخصصين' : 'Specialists',
    loading: language === 'ar' ? 'جاري التحميل...' : 'Loading facilities...',
    noFacilities: language === 'ar' ? 'لم يتم العثور على مرافق' : 'No facilities found',
    adjustFilters: language === 'ar' ? 'حاول تعديل مرشحات البحث' : 'Try adjusting your search filters',
    getDirections: language === 'ar' ? 'احصل على الاتجاهات' : 'Get Directions',
    viewOnMap: language === 'ar' ? 'عرض على الخريطة' : 'View on Map',
    viewDetails: language === 'ar' ? 'عرض التفاصيل' : 'View Details',
    openNow: language === 'ar' ? 'مفتوح الآن' : 'Open Now',
    closed: language === 'ar' ? 'مغلق' : 'Closed',
    services: language === 'ar' ? 'الخدمات' : 'Services',
    website: language === 'ar' ? 'الموقع الإلكتروني' : 'Website',
    kmAway: language === 'ar' ? 'كم' : 'km away',
    photos: language === 'ar' ? 'الصور' : 'Photos',
    reviews: language === 'ar' ? 'التقييمات' : 'Reviews',
    openingHours: language === 'ar' ? 'ساعات العمل' : 'Opening Hours',
    loadMore: language === 'ar' ? 'تحميل المزيد' : 'Load More',
    showing: language === 'ar' ? 'عرض' : 'Showing',
    results: language === 'ar' ? 'نتيجة' : 'results',
    hasEmergency: language === 'ar' ? 'خدمات طوارئ' : 'Emergency Services',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/patient/portal")}
              className="hover:bg-green-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.back}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                {t.title}
              </h1>
              <p className="text-gray-600 mt-1">{t.subtitle} • <span className="text-green-600 font-semibold">{t.facilitiesCount}</span></p>
            </div>
          </div>
        </div>

        {/* Emergency Banner */}
        <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-900 font-semibold mb-2">
                  {t.emergencyServices}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm text-red-800 bg-white/50 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4" />
                    <span>Iraqi Red Crescent: <strong className="text-red-600">115</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-800 bg-white/50 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4" />
                    <span>Civil Defense: <strong className="text-red-600">115</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-800 bg-white/50 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4" />
                    <span>Police: <strong className="text-red-600">104</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Filters */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6 shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-green-600" />
                  {t.searchFilters}
                </CardTitle>
                <CardDescription>{t.findNearYou}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="space-y-2">
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="min-h-[48px] text-base border-2 focus:border-green-500"
                  />
                </div>

                {/* Facility Type */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t.facilityType}</label>
                  <Select value={facilityType} onValueChange={setFacilityType}>
                    <SelectTrigger className="min-h-[44px]">
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

                {/* City Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t.city}</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder={t.allCities} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">{t.allCities}</SelectItem>
                      {availableCities?.map((city) => (
                        <SelectItem key={city} value={city || ""}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Filters Toggle */}
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full justify-between text-gray-600 hover:text-gray-900"
                >
                  {t.advancedFilters}
                  {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {showAdvancedFilters && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* Specialty Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t.specialty}</label>
                      <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder={t.allSpecialties} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">{t.allSpecialties}</SelectItem>
                          {availableSpecialties?.map((specialty) => (
                            <SelectItem key={specialty} value={specialty || ""}>{specialty}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t.sortBy}</label>
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'distance' | 'rating' | 'name')}>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="distance">{t.distance}</SelectItem>
                          <SelectItem value="rating">{t.rating}</SelectItem>
                          <SelectItem value="name">{t.name}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Real Data Toggle */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="useRealData"
                        checked={useRealData}
                        onChange={(e) => setUseRealData(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="useRealData" className="text-sm text-gray-700 cursor-pointer">
                        {t.useRealData} (Google Places)
                      </label>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 min-h-[48px] text-base shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {t.searchFacilities}
                </Button>

                {/* Statistics */}
                <div className="pt-4 border-t space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.quickStats}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{facilityStats?.total || 0}</p>
                      <p className="text-xs text-blue-700">{t.totalFacilities}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{facilityStats?.hospitals || 0}</p>
                      <p className="text-xs text-red-700">{t.hospitals}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{facilityStats?.clinics || 0}</p>
                      <p className="text-xs text-green-700">{t.clinics}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{facilityStats?.emergency || 0}</p>
                      <p className="text-xs text-orange-700">{t.emergencyCenters}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Results Header */}
            {!isLoading && facilitiesWithDistance.length > 0 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-sm text-gray-600">
                  {t.showing} <span className="font-semibold text-gray-900">{facilitiesWithDistance.length}</span> {t.results}
                </p>
              </div>
            )}

            {isLoading ? (
              <Card className="shadow-lg border-0">
                <CardContent className="py-16 text-center">
                  <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">{t.loading}</p>
                </CardContent>
              </Card>
            ) : facilitiesWithDistance && facilitiesWithDistance.length > 0 ? (
              <>
                {facilitiesWithDistance.map((facility) => {
                  let services: string[] = [];
                  try {
                    services = facility.services ? JSON.parse(facility.services) : [];
                  } catch {
                    services = facility.services ? [facility.services] : [];
                  }
                  
                  return (
                    <Card key={facility.id} className="shadow-md border-0 hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
                      <div className="flex">
                        {/* Type indicator bar */}
                        <div className={`w-1.5 ${getTypeColor(facility.type)}`} />
                        
                        <div className="flex-1">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className={`p-1.5 rounded-lg ${getTypeColor(facility.type)} text-white`}>
                                      {getTypeIcon(facility.type)}
                                    </div>
                                    <span className="truncate">{facility.name}</span>
                                  </CardTitle>
                                  {facility.rating && (
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-semibold text-sm text-yellow-700">{facility.rating}</span>
                                    </div>
                                  )}
                                  {facility.emergencyServices === 1 && (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                      <Activity className="w-3 h-3 mr-1" />
                                      {t.hasEmergency}
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                  <span className="text-gray-600">{facility.address}</span>
                                </CardDescription>
                                {facility.distance && (
                                  <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    {facility.distance.toFixed(1)} {t.kmAway}
                                  </p>
                                )}
                              </div>
                              <Badge className={`${getTypeColor(facility.type)} text-white flex-shrink-0`}>
                                {facility.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-3">
                            <div className="grid md:grid-cols-2 gap-3">
                              {facility.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4 text-green-600" />
                                  <a href={`tel:${facility.phone}`} className="hover:text-green-600 transition-colors">
                                    {facility.phone}
                                  </a>
                                </div>
                              )}
                              {facility.hours && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span>{facility.hours}</span>
                                </div>
                              )}
                              {facility.specialties && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                                  <Stethoscope className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">{facility.specialties}</span>
                                </div>
                              )}
                            </div>

                            {services.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {services.slice(0, 5).map((service, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                    {service}
                                  </Badge>
                                ))}
                                {services.length > 5 && (
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                                    +{services.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => getDirections(facility)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Navigation className="w-4 h-4 mr-1" />
                                {t.getDirections}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewOnMap(facility)}
                                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <MapPinned className="w-4 h-4 mr-1" />
                                {t.viewOnMap}
                              </Button>
                              {facility.website && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(facility.website!, '_blank')}
                                  className="border-gray-200"
                                >
                                  <Globe className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Load More Button */}
                {facilitiesWithDistance.length >= resultsLimit && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      className="px-8"
                    >
                      {t.loadMore}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="shadow-lg border-0">
                <CardContent className="py-16 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.noFacilities}</h3>
                  <p className="text-gray-500">{t.adjustFilters}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CareLocator() {
  return <CareLocatorContent />;
}
