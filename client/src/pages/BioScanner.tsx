import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Brain, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import BioScanner3D from "@/components/BioScanner3D";

export default function BioScanner() {
  const [, setLocation] = useLocation();
  const [selectedSymptoms] = useState([
    "Chest pain",
    "Headache",
    "Abdominal pain",
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                3D Bio-Scanner
              </h1>
              <p className="text-gray-600 mt-1">
                Interactive anatomical visualization and symptom mapping
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  AI-Powered Anatomical Analysis
                </p>
                <p className="text-xs text-blue-800">
                  Click on body regions to view detailed organ information and common symptoms. 
                  Yellow indicators show regions matching patient-reported symptoms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Symptoms */}
        {selectedSymptoms.length > 0 && (
          <Card className="mb-6 card-modern">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Active Symptoms
              </CardTitle>
              <CardDescription>
                Symptoms currently being analyzed and mapped to body regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom, index) => (
                  <Badge
                    key={index}
                    className="bg-yellow-100 text-yellow-900 border-yellow-300"
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3D Bio-Scanner Component */}
        <BioScanner3D
          selectedSymptoms={selectedSymptoms}
          onRegionClick={(region) => {
            console.log("Region clicked:", region);
          }}
        />

        {/* Instructions */}
        <Card className="mt-6 card-modern">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Click Regions</p>
                  <p className="text-gray-600">
                    Click on any body region to view detailed organ information and common symptoms
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Rotate & Zoom</p>
                  <p className="text-gray-600">
                    Use the controls to rotate the model and zoom in/out for better visualization
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Symptom Mapping</p>
                  <p className="text-gray-600">
                    Yellow indicators show regions matching patient symptoms for quick identification
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
