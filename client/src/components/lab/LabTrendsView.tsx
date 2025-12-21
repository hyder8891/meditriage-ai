import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function LabTrendsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab Result Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">
          Track how your lab values change over time. Upload multiple reports to see trends.
        </p>
        
        <div className="mt-6 text-center text-slate-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>Upload more lab reports to view trends</p>
        </div>
      </CardContent>
    </Card>
  );
}
