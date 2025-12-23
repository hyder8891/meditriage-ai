/**
 * Email Service
 * 
 * Comprehensive email notification system using Manus Notification API
 * Supports bilingual templates (Arabic/English) and various email types
 */

import { notifyOwner } from "../_core/notification";

// Email types
export type EmailType =
  | "welcome"
  | "email_verification"
  | "password_reset"
  | "appointment_confirmation"
  | "appointment_reminder"
  | "medication_reminder"
  | "lab_result_ready"
  | "lab_result_critical"
  | "new_message"
  | "message_digest"
  | "subscription_confirmation"
  | "payment_receipt"
  | "invoice"
  | "subscription_expiry_warning"
  | "payment_failure";

// Email data interfaces
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  userRole: "patient" | "clinician";
  language: "en" | "ar";
}

export interface EmailVerificationData {
  userName: string;
  userEmail: string;
  verificationToken: string;
  verificationUrl: string;
  language: "en" | "ar";
}

export interface PasswordResetData {
  userName: string;
  userEmail: string;
  resetToken: string;
  resetUrl: string;
  language: "en" | "ar";
}

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  language: "en" | "ar";
}

export interface MedicationReminderData {
  patientName: string;
  patientEmail: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  nextDoseTime: string;
  language: "en" | "ar";
}

export interface LabResultEmailData {
  patientName: string;
  patientEmail: string;
  reportDate: string;
  abnormalTests?: string[];
  criticalTests?: string[];
  viewUrl: string;
  language: "en" | "ar";
}

export interface MessageNotificationData {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
  language: "en" | "ar";
}

export interface SubscriptionEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  billingPeriod: "monthly" | "yearly";
  nextBillingDate?: string;
  language: "en" | "ar";
}

export interface PaymentReceiptData {
  userName: string;
  userEmail: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  invoiceNumber: string;
  description: string;
  language: "en" | "ar";
}

// Email templates
const templates = {
  welcome: {
    en: {
      subject: (data: WelcomeEmailData) =>
        `Welcome to My Doctor طبيبي, ${data.userName}!`,
      body: (data: WelcomeEmailData) => `
Dear ${data.userName},

Welcome to My Doctor طبيبي! We're thrilled to have you join our healthcare platform.

${
  data.userRole === "patient"
    ? `As a patient, you now have access to:
- AI-powered symptom assessment
- Connect with certified doctors
- Secure messaging with healthcare providers
- Lab result interpretation
- Medical image analysis
- Medication tracking and reminders`
    : `As a healthcare provider, you now have access to:
- BRAIN diagnostic engine
- Clinical reasoning tools
- Patient management dashboard
- Secure messaging with patients
- Lab result interpretation
- Medical imaging analysis
- Appointment scheduling`
}

Get started by logging in to your account and exploring the platform.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: WelcomeEmailData) =>
        `مرحباً بك في تطبيق طبيبي، ${data.userName}!`,
      body: (data: WelcomeEmailData) => `
عزيزي ${data.userName}،

مرحباً بك في تطبيق طبيبي! نحن سعداء بانضمامك إلى منصتنا الصحية.

${
  data.userRole === "patient"
    ? `كمريض، لديك الآن إمكانية الوصول إلى:
- تقييم الأعراض بالذكاء الاصطناعي
- التواصل مع أطباء معتمدين
- المراسلة الآمنة مع مقدمي الرعاية الصحية
- تفسير نتائج المختبر
- تحليل الصور الطبية
- تتبع الأدوية والتذكيرات`
    : `كمقدم رعاية صحية، لديك الآن إمكانية الوصول إلى:
- محرك التشخيص BRAIN
- أدوات التفكير السريري
- لوحة إدارة المرضى
- المراسلة الآمنة مع المرضى
- تفسير نتائج المختبر
- تحليل الصور الطبية
- جدولة المواعيد`
}

ابدأ بتسجيل الدخول إلى حسابك واستكشاف المنصة.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  email_verification: {
    en: {
      subject: () => "Verify Your Email - My Doctor طبيبي",
      body: (data: EmailVerificationData) => `
Dear ${data.userName},

Thank you for registering with My Doctor طبيبي!

Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: () => "تأكيد بريدك الإلكتروني - تطبيق طبيبي",
      body: (data: EmailVerificationData) => `
عزيزي ${data.userName}،

شكراً لتسجيلك في تطبيق طبيبي!

يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الرابط أدناه:

${data.verificationUrl}

سينتهي صلاحية هذا الرابط خلال 24 ساعة.

إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  password_reset: {
    en: {
      subject: () => "Reset Your Password - My Doctor طبيبي",
      body: (data: PasswordResetData) => `
Dear ${data.userName},

We received a request to reset your password for My Doctor طبيبي.

Click the link below to reset your password:

${data.resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, please do not share this link with anyone.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: () => "إعادة تعيين كلمة المرور - تطبيق طبيبي",
      body: (data: PasswordResetData) => `
عزيزي ${data.userName}،

تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك في تطبيق طبيبي.

انقر على الرابط أدناه لإعادة تعيين كلمة المرور:

${data.resetUrl}

سينتهي صلاحية هذا الرابط خلال ساعة واحدة.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني وستبقى كلمة المرور الخاصة بك دون تغيير.

لأسباب أمنية، يرجى عدم مشاركة هذا الرابط مع أي شخص.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  appointment_confirmation: {
    en: {
      subject: (data: AppointmentEmailData) =>
        `Appointment Confirmed - ${data.appointmentDate}`,
      body: (data: AppointmentEmailData) => `
Dear ${data.patientName},

Your appointment has been confirmed!

**Appointment Details:**
- Doctor: ${data.doctorName}
- Date: ${data.appointmentDate}
- Time: ${data.appointmentTime}
- Type: ${data.appointmentType}

Please arrive 10 minutes early for check-in.

If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: AppointmentEmailData) =>
        `تأكيد الموعد - ${data.appointmentDate}`,
      body: (data: AppointmentEmailData) => `
عزيزي ${data.patientName}،

تم تأكيد موعدك!

**تفاصيل الموعد:**
- الطبيب: ${data.doctorName}
- التاريخ: ${data.appointmentDate}
- الوقت: ${data.appointmentTime}
- النوع: ${data.appointmentType}

يرجى الحضور قبل 10 دقائق لتسجيل الدخول.

إذا كنت بحاجة إلى إعادة الجدولة أو الإلغاء، يرجى الاتصال بنا قبل 24 ساعة على الأقل.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  appointment_reminder: {
    en: {
      subject: (data: AppointmentEmailData) =>
        `Reminder: Appointment Tomorrow with Dr. ${data.doctorName}`,
      body: (data: AppointmentEmailData) => `
Dear ${data.patientName},

This is a friendly reminder about your upcoming appointment:

**Appointment Details:**
- Doctor: ${data.doctorName}
- Date: ${data.appointmentDate}
- Time: ${data.appointmentTime}
- Type: ${data.appointmentType}

Please remember to bring:
- Your ID
- Insurance card (if applicable)
- List of current medications
- Any relevant medical records

See you tomorrow!

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: AppointmentEmailData) =>
        `تذكير: موعد غداً مع د. ${data.doctorName}`,
      body: (data: AppointmentEmailData) => `
عزيزي ${data.patientName}،

هذا تذكير ودي بموعدك القادم:

**تفاصيل الموعد:**
- الطبيب: ${data.doctorName}
- التاريخ: ${data.appointmentDate}
- الوقت: ${data.appointmentTime}
- النوع: ${data.appointmentType}

يرجى تذكر إحضار:
- بطاقة الهوية
- بطاقة التأمين (إن وجدت)
- قائمة الأدوية الحالية
- أي سجلات طبية ذات صلة

نراك غداً!

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  medication_reminder: {
    en: {
      subject: (data: MedicationReminderData) =>
        `Medication Reminder: ${data.medicationName}`,
      body: (data: MedicationReminderData) => `
Dear ${data.patientName},

Time to take your medication!

**Medication Details:**
- Name: ${data.medicationName}
- Dosage: ${data.dosage}
- Frequency: ${data.frequency}
- Next Dose: ${data.nextDoseTime}

Please take your medication as prescribed by your doctor.

If you have any questions or concerns, please contact your healthcare provider.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: MedicationReminderData) =>
        `تذكير بالدواء: ${data.medicationName}`,
      body: (data: MedicationReminderData) => `
عزيزي ${data.patientName}،

حان وقت تناول دوائك!

**تفاصيل الدواء:**
- الاسم: ${data.medicationName}
- الجرعة: ${data.dosage}
- التكرار: ${data.frequency}
- الجرعة التالية: ${data.nextDoseTime}

يرجى تناول دوائك كما وصفه طبيبك.

إذا كان لديك أي أسئلة أو مخاوف، يرجى الاتصال بمقدم الرعاية الصحية الخاص بك.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  lab_result_ready: {
    en: {
      subject: () => "Your Lab Results Are Ready",
      body: (data: LabResultEmailData) => `
Dear ${data.patientName},

Your lab results from ${data.reportDate} are now available.

${
  data.abnormalTests && data.abnormalTests.length > 0
    ? `**Abnormal Results Detected:**
${data.abnormalTests.map((test) => `- ${test}`).join("\n")}

Please review your results and consult with your doctor if needed.`
    : "All results are within normal ranges."
}

View your complete results here: ${data.viewUrl}

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: () => "نتائج المختبر الخاصة بك جاهزة",
      body: (data: LabResultEmailData) => `
عزيزي ${data.patientName}،

نتائج المختبر الخاصة بك من ${data.reportDate} متاحة الآن.

${
  data.abnormalTests && data.abnormalTests.length > 0
    ? `**تم اكتشاف نتائج غير طبيعية:**
${data.abnormalTests.map((test) => `- ${test}`).join("\n")}

يرجى مراجعة نتائجك والتشاور مع طبيبك إذا لزم الأمر.`
    : "جميع النتائج ضمن النطاقات الطبيعية."
}

اعرض نتائجك الكاملة هنا: ${data.viewUrl}

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  lab_result_critical: {
    en: {
      subject: () => "URGENT: Critical Lab Results - Immediate Action Required",
      body: (data: LabResultEmailData) => `
Dear ${data.patientName},

⚠️ **URGENT: Critical Lab Results Detected**

Your lab results from ${data.reportDate} contain critical values that require immediate medical attention.

**Critical Tests:**
${data.criticalTests?.map((test) => `- ${test}`).join("\n")}

**IMMEDIATE ACTION REQUIRED:**
Please contact your doctor immediately or visit the nearest emergency room.

View your results here: ${data.viewUrl}

This is an automated alert. For medical emergencies, call 122 (Iraq Emergency Services).

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: () => "عاجل: نتائج مختبر حرجة - يتطلب إجراء فوري",
      body: (data: LabResultEmailData) => `
عزيزي ${data.patientName}،

⚠️ **عاجل: تم اكتشاف نتائج مختبر حرجة**

نتائج المختبر الخاصة بك من ${data.reportDate} تحتوي على قيم حرجة تتطلب عناية طبية فورية.

**الفحوصات الحرجة:**
${data.criticalTests?.map((test) => `- ${test}`).join("\n")}

**يتطلب إجراء فوري:**
يرجى الاتصال بطبيبك فوراً أو زيارة أقرب غرفة طوارئ.

اعرض نتائجك هنا: ${data.viewUrl}

هذا تنبيه تلقائي. في حالات الطوارئ الطبية، اتصل بالرقم 122 (خدمات الطوارئ العراقية).

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  new_message: {
    en: {
      subject: (data: MessageNotificationData) =>
        `New Message from ${data.senderName}`,
      body: (data: MessageNotificationData) => `
Dear ${data.recipientName},

You have received a new message from ${data.senderName}:

"${data.messagePreview}"

View and reply to this message: ${data.conversationUrl}

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: MessageNotificationData) =>
        `رسالة جديدة من ${data.senderName}`,
      body: (data: MessageNotificationData) => `
عزيزي ${data.recipientName}،

لقد تلقيت رسالة جديدة من ${data.senderName}:

"${data.messagePreview}"

اعرض هذه الرسالة ورد عليها: ${data.conversationUrl}

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  subscription_confirmation: {
    en: {
      subject: (data: SubscriptionEmailData) =>
        `Subscription Confirmed: ${data.planName}`,
      body: (data: SubscriptionEmailData) => `
Dear ${data.userName},

Thank you for subscribing to My Doctor طبيبي!

**Subscription Details:**
- Plan: ${data.planName}
- Amount: $${data.amount}
- Billing Period: ${data.billingPeriod}
${data.nextBillingDate ? `- Next Billing Date: ${data.nextBillingDate}` : ""}

You now have full access to all premium features.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: SubscriptionEmailData) =>
        `تأكيد الاشتراك: ${data.planName}`,
      body: (data: SubscriptionEmailData) => `
عزيزي ${data.userName}،

شكراً لاشتراكك في تطبيق طبيبي!

**تفاصيل الاشتراك:**
- الخطة: ${data.planName}
- المبلغ: $${data.amount}
- فترة الفوترة: ${data.billingPeriod === "monthly" ? "شهرياً" : "سنوياً"}
${data.nextBillingDate ? `- تاريخ الفوترة التالي: ${data.nextBillingDate}` : ""}

لديك الآن وصول كامل إلى جميع الميزات المميزة.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },

  payment_receipt: {
    en: {
      subject: (data: PaymentReceiptData) =>
        `Payment Receipt - Invoice #${data.invoiceNumber}`,
      body: (data: PaymentReceiptData) => `
Dear ${data.userName},

Thank you for your payment!

**Payment Receipt:**
- Invoice Number: ${data.invoiceNumber}
- Amount: $${data.amount}
- Payment Date: ${data.paymentDate}
- Payment Method: ${data.paymentMethod}
- Description: ${data.description}

This email serves as your official receipt.

Best regards,
My Doctor طبيبي Team
      `,
    },
    ar: {
      subject: (data: PaymentReceiptData) =>
        `إيصال الدفع - فاتورة #${data.invoiceNumber}`,
      body: (data: PaymentReceiptData) => `
عزيزي ${data.userName}،

شكراً لدفعك!

**إيصال الدفع:**
- رقم الفاتورة: ${data.invoiceNumber}
- المبلغ: $${data.amount}
- تاريخ الدفع: ${data.paymentDate}
- طريقة الدفع: ${data.paymentMethod}
- الوصف: ${data.description}

يعتبر هذا البريد الإلكتروني إيصالك الرسمي.

مع أطيب التحيات،
فريق تطبيق طبيبي
      `,
    },
  },
};

/**
 * Send email using Manus notification API
 * Currently sends to project owner - will be extended to send to users
 */
export async function sendEmail(
  type: EmailType,
  data: any,
  recipientEmail: string
): Promise<boolean> {
  try {
    const language = data.language || "en";
    const template = templates[type as keyof typeof templates];

    if (!template) {
      console.error(`[Email] Unknown email type: ${type}`);
      return false;
    }

    const langTemplate = template[language as keyof typeof template];
    const subject =
      typeof langTemplate.subject === "function"
        ? langTemplate.subject(data)
        : langTemplate.subject;
    const body =
      typeof langTemplate.body === "function"
        ? langTemplate.body(data)
        : langTemplate.body;

    // For now, send to project owner via Manus notification API
    // In production, this would integrate with SendGrid, AWS SES, or similar
    const success = await notifyOwner({
      title: `[${type.toUpperCase()}] ${subject}`,
      content: `
**Recipient:** ${recipientEmail}

---

${body}
      `,
    });

    if (success) {
      console.log(`[Email] Sent ${type} email to ${recipientEmail}`);
    } else {
      console.error(`[Email] Failed to send ${type} email to ${recipientEmail}`);
    }

    return success;
  } catch (error) {
    console.error(`[Email] Error sending ${type} email:`, error);
    return false;
  }
}

// Convenience functions for each email type
export const sendWelcomeEmail = (data: WelcomeEmailData) =>
  sendEmail("welcome", data, data.userEmail);

export const sendEmailVerification = (data: EmailVerificationData) =>
  sendEmail("email_verification", data, data.userEmail);

export const sendPasswordResetEmail = (data: PasswordResetData) =>
  sendEmail("password_reset", data, data.userEmail);

export const sendAppointmentConfirmation = (data: AppointmentEmailData) =>
  sendEmail("appointment_confirmation", data, data.patientEmail);

export const sendAppointmentReminder = (data: AppointmentEmailData) =>
  sendEmail("appointment_reminder", data, data.patientEmail);

export const sendMedicationReminder = (data: MedicationReminderData) =>
  sendEmail("medication_reminder", data, data.patientEmail);

export const sendLabResultNotification = (data: LabResultEmailData) =>
  sendEmail("lab_result_ready", data, data.patientEmail);

export const sendCriticalLabResultAlert = (data: LabResultEmailData) =>
  sendEmail("lab_result_critical", data, data.patientEmail);

export const sendMessageNotification = (data: MessageNotificationData) =>
  sendEmail("new_message", data, data.recipientEmail);

export const sendSubscriptionConfirmation = (data: SubscriptionEmailData) =>
  sendEmail("subscription_confirmation", data, data.userEmail);

export const sendPaymentReceipt = (data: PaymentReceiptData) =>
  sendEmail("payment_receipt", data, data.userEmail);
