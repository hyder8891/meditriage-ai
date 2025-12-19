import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Info,
  Heart,
  Brain,
  Activity,
  Stethoscope,
  Eye,
} from "lucide-react";

interface OrganDetail {
  name: string;
  function: string;
  commonConditions: string[];
  diagnosticTests: string[];
  icon: any;
  riskFactors?: string[];
  preventiveMeasures?: string[];
  emergencySymptoms?: string[];
}

interface BodyRegion {
  id: string;
  name: string;
  path: string;
  color: string;
  organs: string[];
  organDetails: OrganDetail[];
  commonSymptoms: string[];
  diagnosticApproach: string;
}

const bodyRegions: BodyRegion[] = [
  {
    id: "head",
    name: "Head & Neck",
    path: "M250,50 Q280,50 280,80 L280,120 Q280,140 260,140 L240,140 Q220,140 220,120 L220,80 Q220,50 250,50",
    color: "#3b82f6",
    organs: ["Brain", "Eyes", "Ears", "Nose", "Throat"],
    organDetails: [
      {
        name: "Brain",
        function: "Central nervous system control, cognition, memory, and motor coordination",
        commonConditions: ["Migraine", "Stroke", "Meningitis", "Concussion", "Brain tumor"],
        diagnosticTests: ["CT scan", "MRI", "EEG", "Neurological examination"],
        icon: Brain,
        riskFactors: ["Hypertension", "Diabetes", "Smoking", "High cholesterol", "Family history", "Head trauma"],
        preventiveMeasures: ["Regular exercise", "Healthy diet", "Blood pressure control", "Avoid smoking", "Mental stimulation"],
        emergencySymptoms: ["Sudden severe headache", "Loss of consciousness", "Seizures", "Sudden weakness or numbness", "Difficulty speaking"],
      },
      {
        name: "Eyes",
        function: "Vision and visual processing",
        commonConditions: ["Conjunctivitis", "Glaucoma", "Cataracts", "Retinal detachment"],
        diagnosticTests: ["Visual acuity test", "Fundoscopy", "Tonometry", "OCT scan"],
        icon: Eye,
      },
    ],
    commonSymptoms: ["Headache", "Dizziness", "Vision problems", "Sore throat", "Ear pain"],
    diagnosticApproach: "Neurological examination, cranial nerve assessment, visual inspection of throat and ears. Consider imaging for severe or persistent symptoms.",
  },
  {
    id: "chest",
    name: "Chest",
    path: "M220,140 L220,180 Q220,200 230,210 L270,210 Q280,200 280,180 L280,140",
    color: "#ef4444",
    organs: ["Heart", "Lungs", "Esophagus"],
    organDetails: [
      {
        name: "Heart",
        function: "Pumps blood throughout the body, delivering oxygen and nutrients",
        commonConditions: ["Coronary artery disease", "Heart failure", "Arrhythmia", "Myocardial infarction", "Pericarditis"],
        diagnosticTests: ["ECG", "Echocardiogram", "Cardiac enzymes", "Stress test", "Coronary angiography"],
        icon: Heart,
        riskFactors: ["High blood pressure", "High cholesterol", "Smoking", "Diabetes", "Obesity", "Sedentary lifestyle", "Family history"],
        preventiveMeasures: ["Regular exercise", "Heart-healthy diet", "Maintain healthy weight", "Quit smoking", "Manage stress", "Regular checkups"],
        emergencySymptoms: ["Chest pain or pressure", "Shortness of breath", "Pain radiating to arm/jaw", "Severe palpitations", "Sudden dizziness or fainting"],
      },
      {
        name: "Lungs",
        function: "Gas exchange - oxygen intake and carbon dioxide removal",
        commonConditions: ["Pneumonia", "Asthma", "COPD", "Pulmonary embolism", "Tuberculosis"],
        diagnosticTests: ["Chest X-ray", "CT scan", "Pulmonary function tests", "Arterial blood gas", "Bronchoscopy"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Chest pain", "Shortness of breath", "Cough", "Palpitations"],
    diagnosticApproach: "Cardiac and respiratory examination, auscultation, ECG, chest X-ray. Urgent evaluation for acute chest pain or severe dyspnea.",
  },
  {
    id: "abdomen",
    name: "Abdomen",
    path: "M230,210 L230,280 Q230,300 250,300 Q270,300 270,280 L270,210",
    color: "#f59e0b",
    organs: ["Stomach", "Liver", "Intestines", "Kidneys", "Pancreas"],
    organDetails: [
      {
        name: "Liver",
        function: "Detoxification, protein synthesis, bile production, metabolism regulation",
        commonConditions: ["Hepatitis", "Cirrhosis", "Fatty liver disease", "Liver cancer"],
        diagnosticTests: ["Liver function tests", "Ultrasound", "CT scan", "Liver biopsy", "FibroScan"],
        icon: Activity,
      },
      {
        name: "Kidneys",
        function: "Blood filtration, waste removal, fluid and electrolyte balance",
        commonConditions: ["Kidney stones", "Chronic kidney disease", "Pyelonephritis", "Acute kidney injury"],
        diagnosticTests: ["Urinalysis", "Kidney function tests", "Ultrasound", "CT scan", "Kidney biopsy"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Abdominal pain", "Nausea", "Vomiting", "Diarrhea", "Constipation"],
    diagnosticApproach: "Abdominal examination, palpation for tenderness and masses, bowel sounds assessment. Laboratory tests and imaging as indicated.",
  },
  {
    id: "pelvis",
    name: "Pelvis",
    path: "M230,300 L230,340 Q230,360 250,360 Q270,360 270,340 L270,300",
    color: "#8b5cf6",
    organs: ["Bladder", "Reproductive organs"],
    organDetails: [
      {
        name: "Bladder",
        function: "Urine storage and controlled release",
        commonConditions: ["Urinary tract infection", "Bladder stones", "Overactive bladder", "Bladder cancer"],
        diagnosticTests: ["Urinalysis", "Urine culture", "Cystoscopy", "Ultrasound", "Urodynamic studies"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Pelvic pain", "Urinary issues", "Reproductive concerns"],
    diagnosticApproach: "Pelvic examination, urinalysis, reproductive health assessment. Gender-specific evaluation as appropriate.",
  },
  {
    id: "left-arm",
    name: "Left Arm",
    path: "M220,140 L180,180 L170,240 L180,250 L220,210",
    color: "#10b981",
    organs: ["Muscles", "Bones", "Joints"],
    organDetails: [
      {
        name: "Musculoskeletal System",
        function: "Movement, support, protection of organs, blood cell production",
        commonConditions: ["Fractures", "Tendonitis", "Arthritis", "Muscle strain", "Carpal tunnel syndrome"],
        diagnosticTests: ["X-ray", "MRI", "Ultrasound", "Nerve conduction studies", "Joint aspiration"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Arm pain", "Weakness", "Numbness", "Joint pain"],
    diagnosticApproach: "Musculoskeletal examination, range of motion assessment, neurovascular status. Consider cardiac evaluation for left arm pain with chest symptoms.",
  },
  {
    id: "right-arm",
    name: "Right Arm",
    path: "M280,140 L320,180 L330,240 L320,250 L280,210",
    color: "#10b981",
    organs: ["Muscles", "Bones", "Joints"],
    organDetails: [
      {
        name: "Musculoskeletal System",
        function: "Movement, support, protection of organs, blood cell production",
        commonConditions: ["Fractures", "Tendonitis", "Arthritis", "Muscle strain", "Rotator cuff injury"],
        diagnosticTests: ["X-ray", "MRI", "Ultrasound", "Nerve conduction studies", "Joint aspiration"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Arm pain", "Weakness", "Numbness", "Joint pain"],
    diagnosticApproach: "Musculoskeletal examination, range of motion assessment, neurovascular status. Evaluate for overuse injuries and trauma.",
  },
  {
    id: "left-leg",
    name: "Left Leg",
    path: "M230,340 L220,400 L210,480 L220,490 L240,490 L240,360",
    color: "#06b6d4",
    organs: ["Muscles", "Bones", "Joints", "Blood vessels"],
    organDetails: [
      {
        name: "Lower Extremity Vascular System",
        function: "Blood circulation to and from lower limbs",
        commonConditions: ["Deep vein thrombosis", "Peripheral artery disease", "Varicose veins", "Chronic venous insufficiency"],
        diagnosticTests: ["Doppler ultrasound", "Venography", "Ankle-brachial index", "CT angiography"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Leg pain", "Swelling", "Weakness", "Numbness"],
    diagnosticApproach: "Vascular examination, pedal pulses, edema assessment. Consider DVT evaluation for unilateral swelling with pain.",
  },
  {
    id: "right-leg",
    name: "Right Leg",
    path: "M270,340 L280,400 L290,480 L280,490 L260,490 L260,360",
    color: "#06b6d4",
    organs: ["Muscles", "Bones", "Joints", "Blood vessels"],
    organDetails: [
      {
        name: "Lower Extremity Vascular System",
        function: "Blood circulation to and from lower limbs",
        commonConditions: ["Deep vein thrombosis", "Peripheral artery disease", "Varicose veins", "Chronic venous insufficiency"],
        diagnosticTests: ["Doppler ultrasound", "Venography", "Ankle-brachial index", "CT angiography"],
        icon: Activity,
      },
    ],
    commonSymptoms: ["Leg pain", "Swelling", "Weakness", "Numbness"],
    diagnosticApproach: "Vascular examination, pedal pulses, edema assessment. Consider DVT evaluation for unilateral swelling with pain.",
  },
];

interface BioScanner3DProps {
  selectedSymptoms?: string[];
  onRegionClick?: (region: BodyRegion) => void;
}

export default function BioScanner3D({ selectedSymptoms = [], onRegionClick }: BioScanner3DProps) {
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganDetail | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [symptomIntensity, setSymptomIntensity] = useState<Record<string, number>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRegionClick = (region: BodyRegion) => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setSelectedRegion(region);
    if (onRegionClick) {
      onRegionClick(region);
    }
  };

  const handleOrganClick = (organ: OrganDetail) => {
    setSelectedOrgan(organ);
  };

  const handleRotate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
  };

  // Auto-rotate effect
  useEffect(() => {
    if (autoRotate) {
      rotationIntervalRef.current = setInterval(() => {
        setRotation((prev) => (prev + 1) % 360);
      }, 50);
    } else {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    }
    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [autoRotate]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setRotation(0);
    setZoom(1);
    setSelectedRegion(null);
  };

  const isRegionHighlighted = (region: BodyRegion) => {
    return selectedSymptoms.some((symptom) =>
      region.commonSymptoms.some((s) => s.toLowerCase().includes(symptom.toLowerCase()))
    );
  };

  const getRegionIntensity = (region: BodyRegion) => {
    const matchCount = selectedSymptoms.filter((symptom) =>
      region.commonSymptoms.some((s) => s.toLowerCase().includes(symptom.toLowerCase()))
    ).length;
    return Math.min(matchCount / Math.max(selectedSymptoms.length, 1), 1);
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.7) return '#ef4444'; // Red - high intensity
    if (intensity >= 0.4) return '#f59e0b'; // Orange - medium intensity
    return '#fbbf24'; // Yellow - low intensity
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 3D Viewer */}
      <div className="lg:col-span-2">
        <Card className="card-modern">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-blue-600" />
                3D Bio-Scanner
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRotate ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAutoRotate}
                  title="Auto Rotate"
                  className={autoRotate ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-8 flex items-center justify-center min-h-[600px]">
              <svg
                ref={svgRef}
                viewBox="0 0 500 550"
                className={`w-full h-full ${isAnimating ? 'transition-transform duration-300 ease-in-out' : ''}`}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  maxWidth: "400px",
                  maxHeight: "600px",
                }}
              >
                {/* Body outline */}
                <path
                  d="M250,50 Q280,50 280,80 L280,120 Q280,140 260,140 L280,140 L320,180 L330,240 L320,250 L280,210 L280,180 L280,200 L280,280 L280,300 L280,340 L290,480 L280,490 L260,490 L260,360 L250,360 L240,360 L240,490 L220,490 L210,480 L220,400 L230,340 L230,300 L230,280 L230,210 L230,200 L220,180 L220,210 L180,250 L170,240 L180,180 L220,140 L240,140 Q220,140 220,120 L220,80 Q220,50 250,50"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  opacity="0.3"
                />

                {/* Interactive body regions */}
                {bodyRegions.map((region) => {
                  const isHighlighted = isRegionHighlighted(region);
                  const isSelected = selectedRegion?.id === region.id;
                  const isHovered = hoveredRegion === region.id;
                  const intensity = getRegionIntensity(region);
                  const intensityColor = getIntensityColor(intensity);

                  return (
                    <g key={region.id}>
                      <path
                        d={region.path}
                        fill={isHighlighted ? intensityColor : region.color}
                        opacity={isSelected ? 0.9 : isHighlighted ? 0.7 : isHovered ? 0.5 : 0.3}
                        stroke={isSelected ? region.color : isHighlighted ? intensityColor : region.color}
                        strokeWidth={isSelected ? 3 : isHighlighted ? 3 : 1}
                        className={`cursor-pointer ${isAnimating ? 'transition-all duration-300 ease-in-out' : 'transition-all duration-200'}`}
                        onClick={() => handleRegionClick(region)}
                        onMouseEnter={() => setHoveredRegion(region.id)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                      {isHighlighted && (
                        <circle
                          cx={region.id.includes("head") ? 250 : region.id.includes("chest") ? 250 : region.id.includes("abdomen") ? 250 : region.id.includes("pelvis") ? 250 : region.id.includes("left") ? 200 : 300}
                          cy={region.id.includes("head") ? 90 : region.id.includes("chest") ? 170 : region.id.includes("abdomen") ? 250 : region.id.includes("pelvis") ? 330 : region.id.includes("arm") ? 200 : 420}
                          r="8"
                          fill="#fbbf24"
                          className="animate-pulse"
                        >
                          <animate
                            attributeName="r"
                            values="8;12;8"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Labels */}
                {hoveredRegion && (
                  <text
                    x="250"
                    y="30"
                    textAnchor="middle"
                    className="text-sm font-semibold fill-gray-700"
                  >
                    {bodyRegions.find((r) => r.id === hoveredRegion)?.name}
                  </text>
                )}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="font-semibold">Symptom Intensity</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>High (70%+)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Medium (40-70%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span>Low (&lt;40%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-2 pt-2 border-t border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-blue-400 opacity-50"></div>
                    <span>Click to view details</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Region Details Panel */}
      <div className="lg:col-span-1">
        <Card className="card-modern sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedRegion ? selectedRegion.name : "Region Details"}
            </CardTitle>
            {selectedRegion && (
              <CardDescription>{selectedRegion.diagnosticApproach}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRegion ? (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Organs in this region
                  </h4>
                  <div className="space-y-2">
                    {selectedRegion.organDetails.map((organ, index) => {
                      const Icon = organ.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => handleOrganClick(organ)}
                        >
                          <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="text-sm">{organ.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Common Symptoms
                  </h4>
                  <ul className="space-y-1">
                    {selectedRegion.commonSymptoms.map((symptom, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                {isRegionHighlighted(selectedRegion) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 animate-pulse">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-yellow-900 mb-1">
                          Symptoms Detected
                        </p>
                        <p className="text-xs text-yellow-800">
                          Patient reported symptoms match this region. Review clinical reasoning for detailed analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Maximize2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Click on a body region to view detailed information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organ Detail Modal */}
      <Dialog open={!!selectedOrgan} onOpenChange={() => setSelectedOrgan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedOrgan && <selectedOrgan.icon className="w-6 h-6 text-blue-600" />}
              {selectedOrgan?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedOrgan?.function}
            </DialogDescription>
          </DialogHeader>
          {selectedOrgan && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Common Conditions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedOrgan.commonConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Diagnostic Tests
                </h4>
                <ul className="space-y-1">
                  {selectedOrgan.diagnosticTests.map((test, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      {test}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedOrgan.riskFactors && selectedOrgan.riskFactors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Risk Factors
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrgan.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-orange-300 text-orange-700">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrgan.preventiveMeasures && selectedOrgan.preventiveMeasures.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-600" />
                    Preventive Measures
                  </h4>
                  <ul className="space-y-1">
                    {selectedOrgan.preventiveMeasures.map((measure, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                        {measure}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOrgan.emergencySymptoms && selectedOrgan.emergencySymptoms.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Emergency Symptoms - Seek Immediate Care
                  </h4>
                  <ul className="space-y-1">
                    {selectedOrgan.emergencySymptoms.map((symptom, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-800 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                        {symptom}
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
