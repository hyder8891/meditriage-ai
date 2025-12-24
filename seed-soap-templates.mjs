import { seedSystemTemplates } from "./server/soap-templates.ts";

console.log("🌱 Seeding SOAP note templates...");

try {
  const result = await seedSystemTemplates();
  if (result.success) {
    console.log("✅ Templates seeded successfully!");
  } else {
    console.error("❌ Seeding failed:", result.error);
  }
} catch (error) {
  console.error("❌ Error during seeding:", error);
}
