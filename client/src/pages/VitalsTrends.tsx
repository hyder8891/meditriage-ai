import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, Heart, Brain, TrendingUp, Calendar, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type TimeRange = "24h" | "7d" | "30d" | "all";
type Metric = "heartRate" | "stress" | "rmssd" | "sdnn";

export default function VitalsTrends() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("heartRate");
  const [chartType, setChartType] = useState<"line" | "area">("area");

  const { data: trendsData, isLoading } = trpc.vitals.getTrends.useQuery({
    timeRange,
    metric: selectedMetric,
  });

  const { data: stats } = trpc.vitals.getStats.useQuery();

  const metricConfig = {
    heartRate: {
      label: isArabic ? "معدل ضربات القلب" : "Heart Rate",
      unit: "BPM",
      color: "#ef4444",
      icon: Heart,
    },
    stress: {
      label: isArabic ? "مستوى التوتر" : "Stress Level",
      unit: "/100",
      color: "#f59e0b",
      icon: Brain,
    },
    rmssd: {
      label: isArabic ? "RMSSD" : "RMSSD",
      unit: "ms",
      color: "#8b5cf6",
      icon: Activity,
    },
    sdnn: {
      label: isArabic ? "SDNN" : "SDNN",
      unit: "ms",
      color: "#06b6d4",
      icon: TrendingUp,
    },
  };

  const timeRangeOptions = [
    { value: "24h" as TimeRange, label: isArabic ? "24 ساعة" : "24 Hours" },
    { value: "7d" as TimeRange, label: isArabic ? "7 أيام" : "7 Days" },
    { value: "30d" as TimeRange, label: isArabic ? "30 يوم" : "30 Days" },
    { value: "all" as TimeRange, label: isArabic ? "الكل" : "All Time" },
  ];

  const handleExport = () => {
    if (!trendsData || trendsData.length === 0) {
      toast.error(isArabic ? "لا توجد بيانات للتصدير" : "No data to export");
      return;
    }

    const csv = [
      ["Date", "Time", metricConfig[selectedMetric].label, "Confidence"].join(","),
      ...trendsData.map((d) =>
        [
          new Date(d.timestamp).toLocaleDateString(),
          new Date(d.timestamp).toLocaleTimeString(),
          d.value,
          d.confidence || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vitals-${selectedMetric}-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(isArabic ? "تم تصدير البيانات بنجاح" : "Data exported successfully");
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === "24h") {
      return date.toLocaleTimeString(isArabic ? "ar-IQ" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString(isArabic ? "ar-IQ" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const MetricIcon = metricConfig[selectedMetric].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isArabic ? "تحليل العلامات الحيوية" : "Vitals Trends"}
            </h1>
            <p className="text-slate-600 mt-1">
              {isArabic
                ? "تتبع صحة قلبك ومستويات التوتر بمرور الوقت"
                : "Track your heart health and stress levels over time"}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isArabic ? "تصدير CSV" : "Export CSV"}</span>
          </button>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {isArabic ? "متوسط معدل القلب" : "Avg Heart Rate"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgHeartRate} BPM</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {isArabic ? "متوسط التوتر" : "Avg Stress"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgStress}/100</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {isArabic ? "متوسط RMSSD" : "Avg RMSSD"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgRMSSD} ms</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {isArabic ? "إجمالي القياسات" : "Total Readings"}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalReadings}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Range Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isArabic ? "الفترة الزمنية" : "Time Range"}
              </label>
              <div className="flex gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === option.value
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isArabic ? "المقياس" : "Metric"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(metricConfig) as Metric[]).map((metric) => {
                  const Icon = metricConfig[metric].icon;
                  return (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedMetric === metric
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{metricConfig[metric].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isArabic ? "نوع الرسم البياني" : "Chart Type"}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("line")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    chartType === "line"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {isArabic ? "خطي" : "Line"}
                </button>
                <button
                  onClick={() => setChartType("area")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    chartType === "area"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {isArabic ? "مساحي" : "Area"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${metricConfig[selectedMetric].color}20` }}>
              <MetricIcon className="w-6 h-6" style={{ color: metricConfig[selectedMetric].color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {metricConfig[selectedMetric].label}
              </h2>
              <p className="text-sm text-slate-600">
                {isArabic ? `آخر ${timeRangeOptions.find((o) => o.value === timeRange)?.label}` : `Last ${timeRangeOptions.find((o) => o.value === timeRange)?.label}`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : !trendsData || trendsData.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500">
              <Activity className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {isArabic ? "لا توجد بيانات لهذه الفترة" : "No data for this period"}
              </p>
              <p className="text-sm mt-2">
                {isArabic
                  ? "ابدأ بإجراء قياسات باستخدام Bio-Scanner"
                  : "Start taking measurements with Bio-Scanner"}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "line" ? (
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTimestamp}
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                    label={{
                      value: metricConfig[selectedMetric].unit,
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString(isArabic ? "ar-IQ" : "en-US")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={metricConfig[selectedMetric].color}
                    strokeWidth={2}
                    dot={{ fill: metricConfig[selectedMetric].color, r: 4 }}
                    name={metricConfig[selectedMetric].label}
                  />
                </LineChart>
              ) : (
                <AreaChart data={trendsData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricConfig[selectedMetric].color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={metricConfig[selectedMetric].color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTimestamp}
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                    label={{
                      value: metricConfig[selectedMetric].unit,
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString(isArabic ? "ar-IQ" : "en-US")}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={metricConfig[selectedMetric].color}
                    strokeWidth={2}
                    fill="url(#colorValue)"
                    name={metricConfig[selectedMetric].label}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
