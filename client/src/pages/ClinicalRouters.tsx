import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, User, Stethoscope, Brain, AlertCircle } from "lucide-react";

export default function ClinicalRouters() {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [urgency, setUrgency] = useState("");
  const [routingResult, setRoutingResult] = useState<any>(null);

  const routeMutation = trpc.patientRouting.routePatient.useMutation({
    onSuccess: (data) => {
      setRoutingResult(data);
      toast({ title: "تم التوجيه بنجاح", description: "تم تحديد المسار الأمثل للمريض" });
    },
  });

  const handleRoute = () => {
    if (!symptoms || !urgency) {
      toast({ title: "خطأ", description: "يرجى إدخال الأعراض ومستوى الخطورة", variant: "destructive" });
      return;
    }
    routeMutation.mutate({ symptoms, urgency });
  };

  const specialtyIcons: Record<string, string> = {
    cardiology: "❤️",
    neurology: "🧠",
    orthopedics: "🦴",
    pediatrics: "👶",
    emergency: "🚨",
    general: "🩺",
  };

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">التوجيه السريري الذكي</h1>
        <p className="text-muted-foreground">توجيه المرضى تلقائياً إلى التخصص الطبي المناسب باستخدام الذكاء الاصطناعي</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>معلومات المريض</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="symptoms">الأعراض</Label>
              <textarea
                id="symptoms"
                className="w-full min-h-[120px] p-3 border rounded-md"
                placeholder="اكتب الأعراض الرئيسية للمريض..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="urgency">مستوى الخطورة</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستوى الخطورة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">حرجة - Critical</SelectItem>
                  <SelectItem value="urgent">عاجلة - Urgent</SelectItem>
                  <SelectItem value="moderate">متوسطة - Moderate</SelectItem>
                  <SelectItem value="routine">روتينية - Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleRoute}
              disabled={routeMutation.isPending}
              className="w-full"
              size="lg"
            >
              {routeMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <ArrowRight className="ml-2 h-5 w-5" />
                  توجيه المريض
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نتيجة التوجيه</CardTitle>
          </CardHeader>
          <CardContent>
            {!routingResult ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>أدخل معلومات المريض للحصول على توصية التوجيه</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{specialtyIcons[routingResult.specialty] || "🩺"}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{routingResult.specialtyName}</h3>
                      <p className="text-sm text-muted-foreground">التخصص الموصى به</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {routingResult.confidence}% ثقة
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">السبب</h4>
                  <p className="text-sm text-muted-foreground">{routingResult.reasoning}</p>
                </div>

                {routingResult.alternativeSpecialties && routingResult.alternativeSpecialties.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">تخصصات بديلة</h4>
                    <div className="space-y-2">
                      {routingResult.alternativeSpecialties.map((alt: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{alt.name}</span>
                          <Badge variant="outline">{alt.confidence}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {routingResult.urgentActions && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">إجراءات عاجلة</h4>
                        <p className="text-sm text-red-700">{routingResult.urgentActions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>إحصائيات التوجيه</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">156</div>
              <div className="text-sm text-muted-foreground mt-1">حالات موجهة اليوم</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">94%</div>
              <div className="text-sm text-muted-foreground mt-1">دقة التوجيه</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">2.3 دقيقة</div>
              <div className="text-sm text-muted-foreground mt-1">متوسط وقت التوجيه</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">12</div>
              <div className="text-sm text-muted-foreground mt-1">حالات عاجلة</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
