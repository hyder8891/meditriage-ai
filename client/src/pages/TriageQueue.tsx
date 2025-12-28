import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Clock, User, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TriageQueue() {
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "critical" | "urgent" | "routine">("all");

  const { data: queueData, isLoading } = trpc.triage.getQueue.useQuery();
  const assignMutation = trpc.triage.assignToDoctor.useMutation({
    onSuccess: () => {
      toast({ title: "تم التعيين بنجاح", description: "تم تعيين المريض للطبيب" });
    },
  });

  const getUrgencyColor = (level: string) => {
    const urgency = level.toLowerCase();
    if (urgency.includes("critical") || urgency.includes("emergency")) return "destructive";
    if (urgency.includes("urgent") || urgency.includes("high")) return "default";
    return "secondary";
  };

  const getUrgencyIcon = (level: string) => {
    const urgency = level.toLowerCase();
    if (urgency.includes("critical") || urgency.includes("emergency")) return "🚨";
    if (urgency.includes("urgent") || urgency.includes("high")) return "⚠️";
    return "📋";
  };

  const filteredQueue = queueData?.filter((record: any) => {
    if (filterStatus === "all") return true;
    const urgency = record.urgencyLevel.toLowerCase();
    if (filterStatus === "critical") return urgency.includes("critical") || urgency.includes("emergency");
    if (filterStatus === "urgent") return urgency.includes("urgent") || urgency.includes("high");
    if (filterStatus === "routine") return urgency.includes("routine") || urgency.includes("low");
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل قائمة الانتظار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">قائمة انتظار الفرز</h1>
        <p className="text-muted-foreground">إدارة المرضى وترتيب الأولويات حسب مستوى الخطورة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المرضى</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queueData?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">حالات حرجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {queueData?.filter((r: any) => r.urgencyLevel.toLowerCase().includes("critical")).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">حالات عاجلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {queueData?.filter((r: any) => r.urgencyLevel.toLowerCase().includes("urgent")).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">حالات روتينية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {queueData?.filter((r: any) => r.urgencyLevel.toLowerCase().includes("routine")).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="critical">حرجة</TabsTrigger>
          <TabsTrigger value="urgent">عاجلة</TabsTrigger>
          <TabsTrigger value="routine">روتينية</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredQueue?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد حالات</h3>
              <p className="text-muted-foreground">لا توجد حالات في قائمة الانتظار حالياً</p>
            </CardContent>
          </Card>
        ) : (
          filteredQueue?.map((record: any) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getUrgencyIcon(record.urgencyLevel)}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{record.chiefComplaint}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User className="h-4 w-4" />
                          <span>مريض #{record.userId}</span>
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{new Date(record.createdAt).toLocaleString("ar-IQ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={getUrgencyColor(record.urgencyLevel)}>
                        {record.urgencyLevel}
                      </Badge>
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 ml-1" />
                        {Math.floor((Date.now() - new Date(record.createdAt).getTime()) / 60000)} دقيقة
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{record.assessment}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => assignMutation.mutate({ triageId: record.id })}
                      disabled={assignMutation.isPending}
                    >
                      تعيين لي
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحالة</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">الشكوى الرئيسية</h4>
                <p className="text-sm">{selectedRecord.chiefComplaint}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">التقييم</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.assessment}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">التوصيات</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedRecord.recommendations}</p>
              </div>
              {selectedRecord.redFlags && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">علامات تحذيرية</h4>
                  <ul className="text-sm space-y-1">
                    {JSON.parse(selectedRecord.redFlags).map((flag: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
