import { useState } from "react";
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
  Navigation
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CareLocator() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [facilityType, setFacilityType] = useState<string>("");

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

  const iraqiCities = [
    "Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", 
    "Najaf", "Karbala", "Nasiriyah", "Amarah", "Diwaniyah",
    "Kut", "Hillah", "Ramadi", "Fallujah", "Samarra"
  ];

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
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MapPin className="w-8 h-8 text-green-600" />
                Care Locator
              </h1>
              <p className="text-gray-600 mt-1">Find medical facilities across Iraq</p>
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
                  Emergency Services
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
                  Search Filters
                </CardTitle>
                <CardDescription>Find facilities near you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
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
                  <label className="text-sm font-semibold text-gray-700">Facility Type</label>
                  <Select value={facilityType} onValueChange={setFacilityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Facilities
                </Button>

                {/* Quick Stats */}
                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Quick Stats</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Facilities</span>
                      <span className="font-semibold">{facilities?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Emergency Centers</span>
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
                  <p className="text-gray-500">Loading facilities...</p>
                </CardContent>
              </Card>
            ) : facilities && facilities.length > 0 ? (
              facilities.map((facility: any) => (
                <Card key={facility.id} className="card-modern hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Hospital className="w-5 h-5 text-green-600" />
                          {facility.name}
                        </CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {facility.address}, {facility.city}
                        </CardDescription>
                      </div>
                      <Badge className={`${getTypeColor(facility.type)} text-white`}>
                        {facility.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {facility.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${facility.phone}`} className="hover:text-green-600">
                          {facility.phone}
                        </a>
                      </div>
                    )}
                    {facility.hours && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {facility.hours}
                      </div>
                    )}
                    {facility.specialties && facility.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {facility.specialties.map((specialty: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => {
                        const address = encodeURIComponent(`${facility.name}, ${facility.address}, ${facility.city}, Iraq`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="card-modern">
                <CardContent className="py-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No facilities found</p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your search filters or select a different city
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
