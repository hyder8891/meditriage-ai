import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Info,
} from "lucide-react";

interface BodyRegion {
  id: string;
  name: string;
  path: string;
  color: string;
  organs: string[];
  commonSymptoms: string[];
}

const bodyRegions: BodyRegion[] = [
  {
    id: "head",
    name: "Head & Neck",
    path: "M250,50 Q280,50 280,80 L280,120 Q280,140 260,140 L240,140 Q220,140 220,120 L220,80 Q220,50 250,50",
    color: "#3b82f6",
    organs: ["Brain", "Eyes", "Ears", "Nose", "Throat"],
    commonSymptoms: ["Headache", "Dizziness", "Vision problems", "Sore throat", "Ear pain"],
  },
  {
    id: "chest",
    name: "Chest",
    path: "M220,140 L220,180 Q220,200 230,210 L270,210 Q280,200 280,180 L280,140",
    color: "#ef4444",
    organs: ["Heart", "Lungs", "Esophagus"],
    commonSymptoms: ["Chest pain", "Shortness of breath", "Cough", "Palpitations"],
  },
  {
    id: "abdomen",
    name: "Abdomen",
    path: "M230,210 L230,280 Q230,300 250,300 Q270,300 270,280 L270,210",
    color: "#f59e0b",
    organs: ["Stomach", "Liver", "Intestines", "Kidneys", "Pancreas"],
    commonSymptoms: ["Abdominal pain", "Nausea", "Vomiting", "Diarrhea", "Constipation"],
  },
  {
    id: "pelvis",
    name: "Pelvis",
    path: "M230,300 L230,340 Q230,360 250,360 Q270,360 270,340 L270,300",
    color: "#8b5cf6",
    organs: ["Bladder", "Reproductive organs"],
    commonSymptoms: ["Pelvic pain", "Urinary issues", "Reproductive concerns"],
  },
  {
    id: "left-arm",
    name: "Left Arm",
    path: "M220,140 L180,180 L170,240 L180,250 L220,210",
    color: "#10b981",
    organs: ["Muscles", "Bones", "Joints"],
    commonSymptoms: ["Arm pain", "Weakness", "Numbness", "Joint pain"],
  },
  {
    id: "right-arm",
    name: "Right Arm",
    path: "M280,140 L320,180 L330,240 L320,250 L280,210",
    color: "#10b981",
    organs: ["Muscles", "Bones", "Joints"],
    commonSymptoms: ["Arm pain", "Weakness", "Numbness", "Joint pain"],
  },
  {
    id: "left-leg",
    name: "Left Leg",
    path: "M230,340 L220,400 L210,480 L220,490 L240,490 L240,360",
    color: "#06b6d4",
    organs: ["Muscles", "Bones", "Joints", "Blood vessels"],
    commonSymptoms: ["Leg pain", "Swelling", "Weakness", "Numbness"],
  },
  {
    id: "right-leg",
    name: "Right Leg",
    path: "M270,340 L280,400 L290,480 L280,490 L260,490 L260,360",
    color: "#06b6d4",
    organs: ["Muscles", "Bones", "Joints", "Blood vessels"],
    commonSymptoms: ["Leg pain", "Swelling", "Weakness", "Numbness"],
  },
];

interface BioScanner3DProps {
  selectedSymptoms?: string[];
  onRegionClick?: (region: BodyRegion) => void;
}

export default function BioScanner3D({ selectedSymptoms = [], onRegionClick }: BioScanner3DProps) {
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleRegionClick = (region: BodyRegion) => {
    setSelectedRegion(region);
    if (onRegionClick) {
      onRegionClick(region);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setSelectedRegion(null);
  };

  const isRegionHighlighted = (region: BodyRegion) => {
    return selectedSymptoms.some((symptom) =>
      region.commonSymptoms.some((s) => s.toLowerCase().includes(symptom.toLowerCase()))
    );
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
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  title="Rotate"
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
                className="w-full h-full transition-transform duration-300"
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

                  return (
                    <g key={region.id}>
                      <path
                        d={region.path}
                        fill={region.color}
                        opacity={isSelected ? 0.9 : isHighlighted ? 0.7 : isHovered ? 0.5 : 0.3}
                        stroke={isSelected ? region.color : isHighlighted ? "#fbbf24" : region.color}
                        strokeWidth={isSelected ? 3 : isHighlighted ? 2 : 1}
                        className="cursor-pointer transition-all duration-200"
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
                  <span className="font-semibold">Legend</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span>Symptom detected</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
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
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRegion ? (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    Organs in this region
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegion.organs.map((organ, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {organ}
                      </Badge>
                    ))}
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
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
    </div>
  );
}
