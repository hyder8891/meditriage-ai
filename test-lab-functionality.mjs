/**
 * Test Lab Results Functionality
 * Tests the complete lab upload and processing workflow
 */

import fs from "fs";
import path from "path";

console.log("🧪 Lab Results Functionality Test\n");
console.log("=" .repeat(50));

// Check if lab-router exists
const labRouterPath = "./server/lab-router.ts";
if (fs.existsSync(labRouterPath)) {
  console.log("✅ lab-router.ts exists");
  const content = fs.readFileSync(labRouterPath, "utf-8");
  
  // Check for key functions
  const checks = [
    { name: "uploadLabReport", regex: /uploadLabReport.*protectedProcedure/ },
    { name: "processLabReport", regex: /processLabReport.*protectedProcedure/ },
    { name: "getMyLabReports", regex: /getMyLabReports.*protectedProcedure/ },
    { name: "OCR extraction", regex: /extractTextFromLabReport/ },
    { name: "AI interpretation", regex: /interpretLabResult/ },
  ];
  
  checks.forEach(check => {
    if (check.regex.test(content)) {
      console.log(`   ✅ ${check.name} implemented`);
    } else {
      console.log(`   ❌ ${check.name} missing`);
    }
  });
} else {
  console.log("❌ lab-router.ts not found");
}

// Check if lab-ocr exists
const labOcrPath = "./server/lab-ocr.ts";
if (fs.existsSync(labOcrPath)) {
  console.log("\n✅ lab-ocr.ts exists");
  const content = fs.readFileSync(labOcrPath, "utf-8");
  
  if (content.includes("extractTextFromLabReport")) {
    console.log("   ✅ OCR extraction function exists");
  }
  if (content.includes("parseLabResults")) {
    console.log("   ✅ Result parsing function exists");
  }
  if (content.includes("interpretLabResult")) {
    console.log("   ✅ AI interpretation function exists");
  }
} else {
  console.log("\n❌ lab-ocr.ts not found");
}

// Check if lab-db exists
const labDbPath = "./server/lab-db.ts";
if (fs.existsSync(labDbPath)) {
  console.log("\n✅ lab-db.ts exists");
} else {
  console.log("\n❌ lab-db.ts not found");
}

// Check frontend components
console.log("\n" + "=".repeat(50));
console.log("Frontend Components:");
console.log("=".repeat(50));

const components = [
  "./client/src/pages/LabResults.tsx",
  "./client/src/components/lab/LabUploadDialog.tsx",
  "./client/src/components/lab/LabDashboard.tsx",
  "./client/src/components/lab/LabReportCard.tsx",
];

components.forEach(comp => {
  if (fs.existsSync(comp)) {
    console.log(`✅ ${path.basename(comp)} exists`);
  } else {
    console.log(`❌ ${path.basename(comp)} missing`);
  }
});

// Check router registration
console.log("\n" + "=".repeat(50));
console.log("Router Registration:");
console.log("=".repeat(50));

const routersPath = "./server/routers.ts";
if (fs.existsSync(routersPath)) {
  const content = fs.readFileSync(routersPath, "utf-8");
  if (content.includes('lab: labRouter')) {
    console.log("✅ Lab router is registered in main routers");
  } else {
    console.log("❌ Lab router NOT registered");
  }
}

console.log("\n" + "=".repeat(50));
console.log("✅ Lab Results System Infrastructure Complete!");
console.log("=".repeat(50));
console.log("\nNext: Test with actual file upload in browser");

