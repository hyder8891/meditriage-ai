import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const clinicalRouterRouter = router({
  /**
   * Route patient to appropriate specialty based on symptoms and urgency
   */
  routePatient: protectedProcedure
    .input(z.object({
      symptoms: z.string(),
      urgency: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { symptoms, urgency } = input;

      const prompt = `أنت نظام توجيه سريري ذكي. بناءً على الأعراض التالية ومستوى الخطورة، حدد التخصص الطبي الأنسب.

الأعراض: ${symptoms}
مستوى الخطورة: ${urgency}

قم بتحليل الأعراض وتحديد:
1. التخصص الطبي الأنسب (cardiology, neurology, orthopedics, pediatrics, emergency, general, etc.)
2. اسم التخصص بالعربية
3. نسبة الثقة (0-100%)
4. السبب المنطقي للتوجيه
5. تخصصات بديلة محتملة (إن وجدت)
6. إجراءات عاجلة (إن وجدت)

أجب بصيغة JSON فقط:
{
  "specialty": "specialty_code",
  "specialtyName": "اسم التخصص بالعربية",
  "confidence": 95,
  "reasoning": "السبب المنطقي",
  "alternativeSpecialties": [
    {"name": "تخصص بديل", "confidence": 75}
  ],
  "urgentActions": "إجراءات عاجلة إن وجدت"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "أنت نظام توجيه سريري ذكي متخصص في الطب العراقي." },
          { role: "user", content: prompt }
        ],
      });

      const content = response.choices[0].message.content;
      const contentText = typeof content === 'string' ? content : JSON.stringify(content);
      
      try {
        // Extract JSON from response
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback response
      }

      // Fallback if parsing fails
      return {
        specialty: "general",
        specialtyName: "طب عام",
        confidence: 70,
        reasoning: "تم التوجيه إلى الطب العام للتقييم الأولي",
        alternativeSpecialties: [],
        urgentActions: urgency === "critical" ? "يرجى التوجه للطوارئ فوراً" : null
      };
    }),
});
