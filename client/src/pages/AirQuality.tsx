import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AirQuality() {
  const { toast } = useToast();

  return (
    <div className="container py-8" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-6xl">🌬️</span>
          <div>
            <h1 className="text-4xl font-bold">جودة الهواء</h1>
            <p className="text-muted-foreground text-lg">مراقبة جودة الهواء وتوصيات صحية في الوقت الفعلي</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السجلات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">نشط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الميزات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🌬️</span>
            <h3 className="text-xl font-semibold mb-2">جودة الهواء</h3>
            <p className="text-muted-foreground mb-6">مراقبة جودة الهواء وتوصيات صحية في الوقت الفعلي</p>
            <Button onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}>
              ابدأ الاستخدام
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
