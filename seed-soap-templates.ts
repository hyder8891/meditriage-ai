import { seedSystemTemplates } from "./server/soap-templates";

console.log("🌱 Seeding SOAP note templates...");

(async () => {
  try {
    const result = await seedSystemTemplates();
    if (result.success) {
      console.log("✅ Templates seeded successfully!");
      process.exit(0);
    } else {
      console.error("❌ Seeding failed:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
})();
