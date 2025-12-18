import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  Droplets,
  TrendingUp,
  Save,
  AlertCircle
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PatientVitalsInputProps {
  patientId: number;
  caseId?: number;
  onSuccess?: () => void;
}

export function PatientVitalsInput({ patientId, caseId, onSuccess }: PatientVitalsInputProps) {
  const { language } = useLanguage();
  
  // Vital signs state
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState('');
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const saveVitalsMutation = trpc.clinical.saveVitals.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حفظ العلامات الحيوية' : 'Vital signs saved successfully');
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || (language === 'ar' ? 'فشل حفظ العلامات الحيوية' : 'Failed to save vital signs'));
    },
  });

  const resetForm = () => {
    setBloodPressureSystolic('');
    setBloodPressureDiastolic('');
    setHeartRate('');
    setTemperature('');
    setRespiratoryRate('');
    setOxygenSaturation('');
    setWeight('');
    setNotes('');
  };

  const handleSubmit = () => {
    // Validate at least one vital sign is entered
    if (!bloodPressureSystolic && !heartRate && !temperature && !respiratoryRate && !oxygenSaturation && !weight) {
      toast.error(language === 'ar' ? 'يرجى إدخال علامة حيوية واحدة على الأقل' : 'Please enter at least one vital sign');
      return;
    }

    // Validate blood pressure if either value is entered
    if ((bloodPressureSystolic && !bloodPressureDiastolic) || (!bloodPressureSystolic && bloodPressureDiastolic)) {
      toast.error(language === 'ar' ? 'يرجى إدخال كلا قيمتي ضغط الدم' : 'Please enter both systolic and diastolic blood pressure');
      return;
    }

    const vitalsData: any = {
      caseId: caseId || 0, // Use 0 for self-reported vitals without a case
      recordedAt: new Date(),
    };

    if (bloodPressureSystolic && bloodPressureDiastolic) {
      vitalsData.bloodPressure = `${bloodPressureSystolic}/${bloodPressureDiastolic}`;
    }
    if (heartRate) vitalsData.heartRate = parseInt(heartRate);
    if (temperature) vitalsData.temperature = parseFloat(temperature);
    if (respiratoryRate) vitalsData.respiratoryRate = parseInt(respiratoryRate);
    if (oxygenSaturation) vitalsData.oxygenSaturation = parseInt(oxygenSaturation);
    if (weight) vitalsData.weight = parseFloat(weight);
    if (notes) vitalsData.notes = notes;

    saveVitalsMutation.mutate(vitalsData);
  };

  const getVitalStatus = (type: string, value: string) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) return null;

    switch (type) {
      case 'systolic':
        if (numValue < 90) return { color: 'text-blue-600', icon: TrendingUp, text: language === 'ar' ? 'منخفض' : 'Low' };
        if (numValue > 140) return { color: 'text-red-600', icon: AlertCircle, text: language === 'ar' ? 'مرتفع' : 'High' };
        return { color: 'text-green-600', icon: Activity, text: language === 'ar' ? 'طبيعي' : 'Normal' };
      
      case 'diastolic':
        if (numValue < 60) return { color: 'text-blue-600', icon: TrendingUp, text: language === 'ar' ? 'منخفض' : 'Low' };
        if (numValue > 90) return { color: 'text-red-600', icon: AlertCircle, text: language === 'ar' ? 'مرتفع' : 'High' };
        return { color: 'text-green-600', icon: Activity, text: language === 'ar' ? 'طبيعي' : 'Normal' };
      
      case 'heartRate':
        if (numValue < 60) return { color: 'text-blue-600', icon: TrendingUp, text: language === 'ar' ? 'منخفض' : 'Low' };
        if (numValue > 100) return { color: 'text-red-600', icon: AlertCircle, text: language === 'ar' ? 'مرتفع' : 'High' };
        return { color: 'text-green-600', icon: Activity, text: language === 'ar' ? 'طبيعي' : 'Normal' };
      
      case 'temperature':
        if (numValue < 36.1) return { color: 'text-blue-600', icon: TrendingUp, text: language === 'ar' ? 'منخفضة' : 'Low' };
        if (numValue > 37.2) return { color: 'text-red-600', icon: AlertCircle, text: language === 'ar' ? 'مرتفعة' : 'High' };
        return { color: 'text-green-600', icon: Activity, text: language === 'ar' ? 'طبيعية' : 'Normal' };
      
      case 'spo2':
        if (numValue < 95) return { color: 'text-red-600', icon: AlertCircle, text: language === 'ar' ? 'منخفض' : 'Low' };
        return { color: 'text-green-600', icon: Activity, text: language === 'ar' ? 'طبيعي' : 'Normal' };
      
      default:
        return null;
    }
  };

  const t = {
    title: language === 'ar' ? 'تسجيل العلامات الحيوية' : 'Log Vital Signs',
    description: language === 'ar' ? 'سجل علاماتك الحيوية للمراقبة عن بعد' : 'Record your vital signs for remote monitoring',
    bloodPressure: language === 'ar' ? 'ضغط الدم' : 'Blood Pressure',
    systolic: language === 'ar' ? 'الانقباضي' : 'Systolic',
    diastolic: language === 'ar' ? 'الانبساطي' : 'Diastolic',
    heartRate: language === 'ar' ? 'معدل ضربات القلب' : 'Heart Rate',
    temperature: language === 'ar' ? 'درجة الحرارة' : 'Temperature',
    respiratoryRate: language === 'ar' ? 'معدل التنفس' : 'Respiratory Rate',
    oxygenSaturation: language === 'ar' ? 'تشبع الأكسجين' : 'Oxygen Saturation',
    weight: language === 'ar' ? 'الوزن' : 'Weight',
    notes: language === 'ar' ? 'ملاحظات' : 'Notes',
    save: language === 'ar' ? 'حفظ' : 'Save',
    reset: language === 'ar' ? 'إعادة تعيين' : 'Reset',
    optional: language === 'ar' ? 'اختياري' : 'Optional',
    bpmUnit: language === 'ar' ? 'نبضة/دقيقة' : 'bpm',
    celsiusUnit: language === 'ar' ? '°س' : '°C',
    breathsUnit: language === 'ar' ? 'نفس/دقيقة' : 'breaths/min',
    percentUnit: language === 'ar' ? '%' : '%',
    kgUnit: language === 'ar' ? 'كجم' : 'kg',
    mmhgUnit: language === 'ar' ? 'ملم زئبق' : 'mmHg',
  };

  const systolicStatus = getVitalStatus('systolic', bloodPressureSystolic);
  const diastolicStatus = getVitalStatus('diastolic', bloodPressureDiastolic);
  const heartRateStatus = getVitalStatus('heartRate', heartRate);
  const temperatureStatus = getVitalStatus('temperature', temperature);
  const spo2Status = getVitalStatus('spo2', oxygenSaturation);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Blood Pressure */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              {t.bloodPressure} ({t.mmhgUnit})
            </Label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={t.systolic}
                  value={bloodPressureSystolic}
                  onChange={(e) => setBloodPressureSystolic(e.target.value)}
                  className="text-center"
                />
                {systolicStatus && (
                  <p className={`text-xs mt-1 ${systolicStatus.color} flex items-center gap-1`}>
                    <systolicStatus.icon className="w-3 h-3" />
                    {systolicStatus.text}
                  </p>
                )}
              </div>
              <span className="text-2xl text-gray-400">/</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={t.diastolic}
                  value={bloodPressureDiastolic}
                  onChange={(e) => setBloodPressureDiastolic(e.target.value)}
                  className="text-center"
                />
                {diastolicStatus && (
                  <p className={`text-xs mt-1 ${diastolicStatus.color} flex items-center gap-1`}>
                    <diastolicStatus.icon className="w-3 h-3" />
                    {diastolicStatus.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              {t.heartRate} ({t.bpmUnit})
            </Label>
            <Input
              type="number"
              placeholder="72"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
            />
            {heartRateStatus && (
              <p className={`text-xs ${heartRateStatus.color} flex items-center gap-1`}>
                <heartRateStatus.icon className="w-3 h-3" />
                {heartRateStatus.text}
              </p>
            )}
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              {t.temperature} ({t.celsiusUnit})
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="36.6"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
            {temperatureStatus && (
              <p className={`text-xs ${temperatureStatus.color} flex items-center gap-1`}>
                <temperatureStatus.icon className="w-3 h-3" />
                {temperatureStatus.text}
              </p>
            )}
          </div>

          {/* Respiratory Rate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-500" />
              {t.respiratoryRate} ({t.breathsUnit})
            </Label>
            <Input
              type="number"
              placeholder="16"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)}
            />
          </div>

          {/* Oxygen Saturation */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-500" />
              {t.oxygenSaturation} (SpO2 {t.percentUnit})
            </Label>
            <Input
              type="number"
              placeholder="98"
              value={oxygenSaturation}
              onChange={(e) => setOxygenSaturation(e.target.value)}
            />
            {spo2Status && (
              <p className={`text-xs ${spo2Status.color} flex items-center gap-1`}>
                <spo2Status.icon className="w-3 h-3" />
                {spo2Status.text}
              </p>
            )}
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              {t.weight} ({t.kgUnit})
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t.notes} ({t.optional})</Label>
            <Textarea
              placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={saveVitalsMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {t.save}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={saveVitalsMutation.isPending}
            >
              {t.reset}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
