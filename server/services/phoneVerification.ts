/**
 * Simple Phone Verification Service with SMS OTP
 * Stores OTP codes in memory (for development) or Redis (for production)
 */

interface OTPRecord {
  code: string;
  phoneNumber: string;
  expiresAt: number;
  attempts: number;
}

// In-memory storage for OTP codes (replace with Redis in production)
const otpStore = new Map<string, OTPRecord>();

// Configuration
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

/**
 * Generate a random 6-digit OTP code
 */
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP code to phone number via SMS
 * For now, this logs the code (for development)
 * In production, integrate with SMS provider (e.g., AWS SNS, MessageBird, etc.)
 */
export async function sendPhoneVerification(phoneNumber: string): Promise<{ success: boolean; code?: string }> {
  try {
    // Generate OTP code
    const code = generateOTPCode();
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

    // Store OTP
    otpStore.set(phoneNumber, {
      code,
      phoneNumber,
      expiresAt,
      attempts: 0,
    });

    // Clean up expired OTPs
    cleanupExpiredOTPs();

    console.log(`[SMS OTP] Generated code for ${phoneNumber}: ${code}`);
    console.log(`[SMS OTP] Code expires at: ${new Date(expiresAt).toISOString()}`);

    // TODO: In production, send actual SMS here
    // Example with AWS SNS:
    // await sns.publish({
    //   PhoneNumber: phoneNumber,
    //   Message: `Your MediTriage verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
    // }).promise();

    // For development: return the code so it can be displayed in the UI
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    return {
      success: true,
      code: isDevelopment ? code : undefined, // Only return code in development
    };
  } catch (error: any) {
    console.error("[SMS OTP] Error sending OTP:", error.message);
    throw new Error(`Failed to send verification code: ${error.message}`);
  }
}

/**
 * Verify OTP code entered by user
 */
export async function verifyPhoneCode(phoneNumber: string, code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const record = otpStore.get(phoneNumber);

    if (!record) {
      return {
        success: false,
        message: "No verification code found. Please request a new code.",
      };
    }

    // Check if expired
    if (Date.now() > record.expiresAt) {
      otpStore.delete(phoneNumber);
      return {
        success: false,
        message: "Verification code has expired. Please request a new code.",
      };
    }

    // Check attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(phoneNumber);
      return {
        success: false,
        message: "Too many failed attempts. Please request a new code.",
      };
    }

    // Verify code
    if (record.code !== code) {
      record.attempts++;
      otpStore.set(phoneNumber, record);
      
      const remainingAttempts = MAX_ATTEMPTS - record.attempts;
      return {
        success: false,
        message: `Invalid code. ${remainingAttempts} attempts remaining.`,
      };
    }

    // Success - remove the code
    otpStore.delete(phoneNumber);
    console.log(`[SMS OTP] Successfully verified ${phoneNumber}`);

    return {
      success: true,
      message: "Phone number verified successfully",
    };
  } catch (error: any) {
    console.error("[SMS OTP] Error verifying code:", error.message);
    throw new Error(`Failed to verify code: ${error.message}`);
  }
}

/**
 * Clean up expired OTP codes
 */
function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [phoneNumber, record] of Array.from(otpStore.entries())) {
    if (now > record.expiresAt) {
      otpStore.delete(phoneNumber);
      console.log(`[SMS OTP] Cleaned up expired code for ${phoneNumber}`);
    }
  }
}

/**
 * Format phone number to E.164 format
 * Example: "7701234567" with country code "+964" -> "+9647701234567"
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = "+964"): string {
  // Remove any spaces, dashes, or parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");
  
  // If already has country code, return as is
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // If starts with 0, remove it (Iraqi numbers often start with 0)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  // Add country code
  return `${countryCode}${cleaned}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation: 10-15 digits after country code
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Check if OTP exists for phone number (for rate limiting)
 */
export function hasActiveOTP(phoneNumber: string): boolean {
  const record = otpStore.get(phoneNumber);
  if (!record) return false;
  
  // Check if expired
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phoneNumber);
    return false;
  }
  
  return true;
}

/**
 * Get remaining time for OTP (in seconds)
 */
export function getOTPRemainingTime(phoneNumber: string): number {
  const record = otpStore.get(phoneNumber);
  if (!record) return 0;
  
  const remaining = Math.max(0, Math.floor((record.expiresAt - Date.now()) / 1000));
  return remaining;
}

// Clean up expired OTPs every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
