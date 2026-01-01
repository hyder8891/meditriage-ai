import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCircle, Star, Clock, MapPin, Zap, CheckCircle, XCircle, AlertTriangle, Brain, TrendingUp, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function SmartMatching() {
  const { toast } = useToast();
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | undefined>();
  const [urgencyLevel, setUrgencyLevel] = useState<"routine" | "urgent" | "emergency">("routine");
  const [showMatches, setShowMatches] = useState(false);

  // Fetch specialties
  const { data: specialties, isLoading: loadingSpecialties } = trpc.matching.getSpecialties.useQuery({
    parentId: 0, // Get only primary specialties
  });

  // Find matching doctors
  const { data: matches, isLoading: loadingMatches, refetch: refetchMatches } = trpc.matching.findMatchingDoctors.useQuery(
    {
      specialtyId: selectedSpecialty,
      urgencyLevel,
      limit: 5,
    },
    {
      enabled: showMatches,
    }
  );

  // Quick assign mutation
  const quickAssignMutation = trpc.matching.quickAssign.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Doctor Assigned!",
          description: data.message,
        });
      } else if (data.queued) {
        toast({
          title: "Added to Emergency Queue",
          description: data.message,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign doctor mutation
  const assignMutation = trpc.matching.assignDoctor.useMutation({
    onSuccess: () => {
      toast({
        title: "Doctor Assigned",
        description: "The doctor has been notified and will contact you shortly.",
      });
      refetchMatches();
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFindDoctors = () => {
    setShowMatches(true);
    refetchMatches();
  };

  const handleQuickAssign = () => {
    if (urgencyLevel === "routine") {
      toast({
        title: "Quick Assign Not Available",
        description: "Quick assign is only available for urgent and emergency cases.",
        variant: "destructive",
      });
      return;
    }

    quickAssignMutation.mutate({
      specialtyId: selectedSpecialty,
      urgencyLevel: urgencyLevel as "urgent" | "emergency",
    });
  };

  const handleAssignDoctor = (doctorId: number) => {
    assignMutation.mutate({
      doctorId,
      urgencyLevel,
      specialtyRequired: specialties?.find(s => s.id === selectedSpecialty)?.name,
    });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "emergency":
        return "bg-red-500 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">AI-Powered Doctor Matching</h1>
        </div>
        <p className="text-muted-foreground">
          Our intelligent system analyzes specialty, availability, experience, ratings, and location to find your perfect doctor match
        </p>
      </div>

      {/* Features Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-semibold">Smart Ranking</div>
              <div className="text-sm text-muted-foreground">Multi-factor scoring</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-semibold">Quick Assign</div>
              <div className="text-sm text-muted-foreground">For emergencies</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="font-semibold">Best Match</div>
              <div className="text-sm text-muted-foreground">Personalized results</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Criteria */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">What do you need help with?</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Specialty Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Medical Specialty</label>
            <Select
              value={selectedSpecialty?.toString()}
              onValueChange={(value) => setSelectedSpecialty(value === "any" ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select specialty (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Specialty</SelectItem>
                {loadingSpecialties ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  specialties?.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id.toString()}>
                      {specialty.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">Urgency Level</label>
            <Select
              value={urgencyLevel}
              onValueChange={(value: any) => setUrgencyLevel(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine - Can wait</SelectItem>
                <SelectItem value="urgent">Urgent - Need soon</SelectItem>
                <SelectItem value="emergency">Emergency - Need now</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleFindDoctors}
            disabled={loadingMatches}
            size="lg"
            className="flex-1"
          >
            {loadingMatches ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Best Matches...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Find Matching Doctors
              </>
            )}
          </Button>

          {(urgencyLevel === "urgent" || urgencyLevel === "emergency") && (
            <Button
              onClick={handleQuickAssign}
              disabled={quickAssignMutation.isPending}
              variant="destructive"
              size="lg"
            >
              {quickAssignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Assign
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Urgency Badge */}
      {urgencyLevel !== "routine" && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <Badge className={getUrgencyColor(urgencyLevel)}>
            {urgencyLevel.toUpperCase()} CASE
          </Badge>
          <span className="text-sm text-muted-foreground">
            {urgencyLevel === "emergency" 
              ? "Emergency cases bypass capacity limits and get priority matching"
              : "Urgent cases are prioritized in the matching queue"}
          </span>
        </div>
      )}

      {/* Matching Results */}
      {showMatches && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {loadingMatches ? "Finding best matches..." : `Top ${matches?.length || 0} Matching Doctors`}
            </h2>
            {matches && matches.length > 0 && (
              <Badge variant="outline" className="text-sm">
                Sorted by match score
              </Badge>
            )}
          </div>

          {loadingMatches ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing doctors based on:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Specialty match (35%)</li>
                <li>• Availability & wait time (25%)</li>
                <li>• Experience level (15%)</li>
                <li>• Patient ratings (10%)</li>
                <li>• Distance & location (10%)</li>
                <li>• Language compatibility (5%)</li>
              </ul>
            </div>
          ) : matches && matches.length > 0 ? (
            <div className="grid gap-4">
              {matches.map((match, index) => (
                <Card key={match.doctor.id} className="p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
                  {/* Best Match Ribbon */}
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-1 text-xs font-semibold">
                      BEST MATCH
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {/* Doctor Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                          {match.doctor.name?.charAt(0) || "D"}
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-semibold">{match.doctor.name}</h3>
                          {index === 0 && (
                            <Badge className="bg-green-500 text-white">
                              <Award className="w-3 h-3 mr-1" />
                              Top Pick
                            </Badge>
                          )}
                        </div>

                        {/* Specialties */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {match.specialties.map((spec) => (
                            <Badge key={spec.id} variant="outline" className="text-xs">
                              {spec.isPrimary && "⭐ "}
                              {spec.proficiencyLevel} • {spec.yearsOfExperience}y exp
                            </Badge>
                          ))}
                        </div>

                        {/* Match Score with Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">AI Match Score</span>
                            <span className={`text-3xl font-bold ${getMatchScoreColor(match.matchScore)}`}>
                              {match.matchScore}%
                            </span>
                          </div>
                          <Progress value={match.matchScore} className="h-3" />
                        </div>

                        {/* Match Reasons */}
                        <div className="mb-4">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Why this doctor?</div>
                          <div className="flex flex-wrap gap-2">
                            {match.matchReasons.map((reason, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex flex-col items-center">
                            <Clock className="w-5 h-5 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Wait Time</span>
                            <span className="font-semibold">{match.availability.estimatedWaitTimeMinutes}min</span>
                          </div>

                          {match.profile && (
                            <div className="flex flex-col items-center">
                              <Star className="w-5 h-5 text-yellow-500 mb-1" />
                              <span className="text-xs text-muted-foreground">Rating</span>
                              <span className="font-semibold">
                                {parseFloat(match.profile.averageRating || "0").toFixed(1)}/5
                              </span>
                            </div>
                          )}

                          <div className="flex flex-col items-center">
                            <MapPin className="w-5 h-5 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Status</span>
                            <span className="font-semibold text-green-600">Online</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleAssignDoctor(match.doctor.id)}
                      disabled={assignMutation.isPending}
                      size="lg"
                      className="ml-4 min-w-[140px]"
                    >
                      {assignMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserCircle className="mr-2 h-4 w-4" />
                          Select Doctor
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No Doctors Available</h3>
              <p className="text-muted-foreground mb-6">
                All doctors matching your criteria are currently at capacity.
              </p>
              {urgencyLevel !== "emergency" && (
                <Button onClick={handleQuickAssign} variant="outline" size="lg">
                  <Zap className="mr-2 h-4 w-4" />
                  Add to Emergency Queue
                </Button>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
