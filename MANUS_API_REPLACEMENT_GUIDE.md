# Manus API Replacement Guide for MediTriage AI

This document provides a comprehensive analysis of all Manus platform APIs currently used in the MediTriage AI application and the recommended replacements for self-hosting or deploying outside the Manus ecosystem.

---

## Executive Summary

The MediTriage AI application relies on several Manus platform services that are automatically injected via environment variables. To deploy this application independently, you will need to replace **7 core service categories**:

| Service Category | Manus API | Replacement Required | Complexity |
|-----------------|-----------|---------------------|------------|
| Authentication (OAuth) | Manus OAuth Server | Yes - Critical | High |
| AI/LLM Services | Forge API (OpenAI-compatible) | Yes - Critical | Medium |
| Voice Transcription | Forge Whisper API | Yes - Critical | Low |
| Image Generation | Forge Image Service | Yes - Optional | Low |
| Google Maps Proxy | Forge Maps Proxy | Yes - If using maps | Low |
| Storage (S3) | Forge Storage Proxy | Yes - Critical | Medium |
| Push Notifications | Forge Notification Service | Yes - Optional | Medium |

---

## 1. Authentication System (OAuth)

### Current Implementation

The application uses Manus OAuth for user authentication, which is deeply integrated into the core authentication flow.

**Environment Variables Used:**
```
OAUTH_SERVER_URL      → Manus OAuth server endpoint
VITE_OAUTH_PORTAL_URL → Frontend OAuth portal URL
VITE_APP_ID           → Application identifier
JWT_SECRET            → Session token signing key
```

**Files Affected:**
- `server/_core/sdk.ts` - Core OAuth SDK implementation
- `server/_core/oauth.ts` - OAuth route handlers
- `client/src/const.ts` - Login URL generation
- `client/src/_core/hooks/useAuth.ts` - Frontend auth state

**API Endpoints Called:**
```
POST /webdev.v1.WebDevAuthPublicService/ExchangeToken
POST /webdev.v1.WebDevAuthPublicService/GetUserInfo
POST /webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt
```

### Replacement Options

| Option | Description | Effort | Recommended For |
|--------|-------------|--------|-----------------|
| **Firebase Auth** | Google's authentication service with social login support | Medium | Production apps |
| **Auth0** | Enterprise-grade identity platform | Medium | Enterprise deployments |
| **Supabase Auth** | Open-source Firebase alternative | Medium | Cost-conscious projects |
| **Custom JWT** | Build your own with Passport.js | High | Full control needed |
| **Clerk** | Modern auth with pre-built UI components | Low | Quick deployment |

**Recommended Replacement: Firebase Auth or Supabase Auth**

The application already has Firebase configured (`VITE_FIREBASE_*` variables), making Firebase Auth the most straightforward option.

### Implementation Steps

1. **Remove Manus OAuth SDK** (`server/_core/sdk.ts`):
   - Replace `exchangeCodeForToken()` with Firebase Admin SDK token verification
   - Replace `getUserInfo()` with Firebase user lookup
   - Keep the JWT session management (already uses `jose` library)

2. **Update OAuth Routes** (`server/_core/oauth.ts`):
   - Replace callback handler with Firebase ID token verification
   - Modify user upsert to use Firebase UID instead of `openId`

3. **Update Frontend** (`client/src/const.ts`):
   - Replace `getLoginUrl()` with Firebase Auth redirect
   - Use Firebase Auth UI or custom login form

4. **Database Schema Change**:
   - The `users` table uses `openId` as primary key
   - Consider migrating to `firebaseUid` or keeping `openId` mapped to Firebase UID

---

## 2. AI/LLM Services (Gemini via Forge)

### Current Implementation

All AI capabilities route through the Manus Forge API, which provides an OpenAI-compatible interface.

**Environment Variables Used:**
```
BUILT_IN_FORGE_API_URL → Base URL for AI services
BUILT_IN_FORGE_API_KEY → Authentication token
GEMINI_API_KEY         → Direct Gemini key (backup)
DEEPSEEK_API_KEY       → DeepSeek key (legacy, now routes to Gemini)
```

**Files Affected:**
- `server/_core/gemini.ts` - Main AI invocation (555 lines)
- `server/_core/deepseek.ts` - Legacy wrapper (uses Gemini internally)
- `server/_core/resilient-llm.ts` - Fallback/retry logic
- `server/_core/med-gemini.ts` - Medical-specific prompts
- All routers using `invokeGemini()` or `invokeDeepSeek()`

**API Endpoint Called:**
```
POST {FORGE_API_URL}/v1/chat/completions
```

### Replacement Options

| Provider | Endpoint | Cost | Medical Suitability |
|----------|----------|------|---------------------|
| **Google AI (Direct)** | `generativelanguage.googleapis.com` | Pay-per-use | Excellent (Gemini 2.5) |
| **OpenAI** | `api.openai.com` | Pay-per-use | Good (GPT-4) |
| **Anthropic** | `api.anthropic.com` | Pay-per-use | Excellent (Claude 3.5) |
| **Azure OpenAI** | Custom endpoint | Enterprise pricing | HIPAA-compliant |
| **Self-hosted** | Ollama, vLLM | Hardware cost | Variable |

**Recommended Replacement: Google AI Studio (Direct Gemini)**

Since the app is already optimized for Gemini models, using Google AI directly is the simplest path.

### Implementation Steps

1. **Update `server/_core/gemini.ts`**:
   ```typescript
   // Change from:
   const resolveApiUrl = () =>
     ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
       ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
       : "https://forge.manus.im/v1/chat/completions";
   
   // To:
   const resolveApiUrl = () =>
     "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
   ```

2. **Update Authentication**:
   ```typescript
   // Change from:
   const assertApiKey = () => {
     if (!ENV.forgeApiKey) {
       throw new Error("GEMINI API KEY is not configured");
     }
   };
   
   // To:
   const assertApiKey = () => {
     if (!process.env.GEMINI_API_KEY) {
       throw new Error("GEMINI_API_KEY is not configured");
     }
   };
   ```

3. **Update Environment Variables**:
   ```
   # Remove:
   BUILT_IN_FORGE_API_URL
   BUILT_IN_FORGE_API_KEY
   
   # Keep/Add:
   GEMINI_API_KEY=your_google_ai_key
   ```

---

## 3. Voice Transcription (Whisper)

### Current Implementation

Voice transcription uses the Forge API's Whisper endpoint.

**Files Affected:**
- `server/_core/voiceTranscription.ts`

**API Endpoint Called:**
```
POST {FORGE_API_URL}/v1/audio/transcriptions
```

### Replacement Options

| Provider | API | Cost | Quality |
|----------|-----|------|---------|
| **OpenAI Whisper** | `api.openai.com/v1/audio/transcriptions` | $0.006/min | Excellent |
| **Google Speech-to-Text** | Cloud Speech API | $0.006-0.009/min | Excellent |
| **AssemblyAI** | `api.assemblyai.com` | $0.00025/sec | Excellent |
| **Self-hosted Whisper** | Local deployment | Hardware cost | Excellent |
| **Deepgram** | `api.deepgram.com` | $0.0043/min | Very Good |

**Recommended Replacement: OpenAI Whisper API**

The current implementation already uses the OpenAI-compatible Whisper format.

### Implementation Steps

1. **Update `server/_core/voiceTranscription.ts`**:
   ```typescript
   // Change the URL construction:
   const fullUrl = "https://api.openai.com/v1/audio/transcriptions";
   
   // Update authorization header:
   headers: {
     authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
   }
   ```

2. **Add Environment Variable**:
   ```
   OPENAI_API_KEY=sk-your-openai-key
   ```

---

## 4. Image Generation

### Current Implementation

Image generation uses the Forge Image Service.

**Files Affected:**
- `server/_core/imageGeneration.ts`

**API Endpoint Called:**
```
POST {FORGE_API_URL}/images.v1.ImageService/GenerateImage
```

### Replacement Options

| Provider | API | Cost | Quality |
|----------|-----|------|---------|
| **OpenAI DALL-E 3** | `api.openai.com/v1/images/generations` | $0.04-0.12/image | Excellent |
| **Stability AI** | `api.stability.ai` | $0.002-0.02/image | Excellent |
| **Midjourney** | Discord API (unofficial) | $10-60/month | Excellent |
| **Google Imagen** | Vertex AI | Pay-per-use | Excellent |
| **Replicate** | `api.replicate.com` | Pay-per-use | Variable |

**Recommended Replacement: OpenAI DALL-E 3 or Stability AI**

### Implementation Steps

1. **Update `server/_core/imageGeneration.ts`**:
   ```typescript
   // For OpenAI DALL-E:
   const fullUrl = "https://api.openai.com/v1/images/generations";
   
   const response = await fetch(fullUrl, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
     },
     body: JSON.stringify({
       model: "dall-e-3",
       prompt: options.prompt,
       n: 1,
       size: "1024x1024",
       response_format: "b64_json",
     }),
   });
   ```

---

## 5. Google Maps Proxy

### Current Implementation

Maps functionality is proxied through the Forge API.

**Files Affected:**
- `server/_core/map.ts`

**API Endpoint Called:**
```
GET {FORGE_API_URL}/v1/maps/proxy/{endpoint}
```

### Replacement: Direct Google Maps API

### Implementation Steps

1. **Get a Google Maps API Key** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. **Update `server/_core/map.ts`**:
   ```typescript
   function getMapsConfig(): MapsConfig {
     const apiKey = process.env.GOOGLE_MAPS_API_KEY;
     if (!apiKey) {
       throw new Error("GOOGLE_MAPS_API_KEY is not configured");
     }
     return {
       baseUrl: "https://maps.googleapis.com",
       apiKey,
     };
   }
   
   export async function makeRequest<T = unknown>(
     endpoint: string,
     params: Record<string, unknown> = {},
   ): Promise<T> {
     const { baseUrl, apiKey } = getMapsConfig();
     const url = new URL(`${baseUrl}${endpoint}`);
     url.searchParams.append("key", apiKey);
     // ... rest of implementation
   }
   ```

3. **Add Environment Variable**:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

---

## 6. Storage (S3 Proxy)

### Current Implementation

File storage uses the Forge storage proxy.

**Files Affected:**
- `server/storage.ts`

**API Endpoints Called:**
```
POST {FORGE_API_URL}/v1/storage/upload
GET  {FORGE_API_URL}/v1/storage/downloadUrl
```

### Replacement Options

| Provider | Service | Cost | Complexity |
|----------|---------|------|------------|
| **AWS S3** | Direct S3 | $0.023/GB/month | Medium |
| **Cloudflare R2** | S3-compatible | $0.015/GB/month | Low |
| **Google Cloud Storage** | GCS | $0.020/GB/month | Medium |
| **Supabase Storage** | S3-compatible | Free tier available | Low |
| **MinIO** | Self-hosted S3 | Hardware cost | High |

**Recommended Replacement: AWS S3 or Cloudflare R2**

### Implementation Steps

1. **Install AWS SDK**:
   ```bash
   pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Replace `server/storage.ts`**:
   ```typescript
   import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
   
   const s3Client = new S3Client({
     region: process.env.AWS_REGION || "us-east-1",
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });
   
   const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
   
   export async function storagePut(
     relKey: string,
     data: Buffer | Uint8Array | string,
     contentType = "application/octet-stream"
   ): Promise<{ key: string; url: string }> {
     const key = relKey.replace(/^\/+/, "");
     
     await s3Client.send(new PutObjectCommand({
       Bucket: BUCKET_NAME,
       Key: key,
       Body: data,
       ContentType: contentType,
     }));
     
     const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
     return { key, url };
   }
   
   export async function storageGet(
     relKey: string,
     expiresIn = 3600
   ): Promise<{ key: string; url: string }> {
     const key = relKey.replace(/^\/+/, "");
     
     const url = await getSignedUrl(s3Client, new GetObjectCommand({
       Bucket: BUCKET_NAME,
       Key: key,
     }), { expiresIn });
     
     return { key, url };
   }
   ```

3. **Add Environment Variables**:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   S3_BUCKET_NAME=your-bucket-name
   ```

---

## 7. Push Notifications

### Current Implementation

Notifications are sent to the app owner via the Forge notification service.

**Files Affected:**
- `server/_core/notification.ts`
- `server/services/email.ts` (uses notification as fallback)

**API Endpoint Called:**
```
POST {FORGE_API_URL}/webdevtoken.v1.WebDevService/SendNotification
```

### Replacement Options

| Provider | Service | Cost | Features |
|----------|---------|------|----------|
| **Firebase Cloud Messaging** | FCM | Free | Push notifications |
| **OneSignal** | Push service | Free tier | Multi-platform |
| **Pusher** | Real-time messaging | Free tier | WebSockets |
| **SendGrid** | Email notifications | Free tier | Email delivery |
| **Twilio** | SMS/Email | Pay-per-use | Multi-channel |

**Recommended Replacement: Firebase Cloud Messaging + SendGrid**

### Implementation Steps

1. **For Push Notifications** - Use Firebase Cloud Messaging (already configured)

2. **For Email Notifications** - Replace with SendGrid or Resend:
   ```typescript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
     try {
       await resend.emails.send({
         from: 'MediTriage AI <notifications@yourdomain.com>',
         to: process.env.OWNER_EMAIL!,
         subject: payload.title,
         text: payload.content,
       });
       return true;
     } catch (error) {
       console.error('[Notification] Failed:', error);
       return false;
     }
   }
   ```

3. **Add Environment Variables**:
   ```
   RESEND_API_KEY=re_your_resend_key
   OWNER_EMAIL=owner@yourdomain.com
   ```

---

## 8. Vite Plugin (Development Only)

### Current Implementation

The `vite-plugin-manus-runtime` is used for development features.

**Files Affected:**
- `vite.config.ts`
- `package.json`

### Replacement

This plugin is only needed for Manus development environment features. For production deployment:

1. **Remove from `vite.config.ts`**:
   ```typescript
   // Remove:
   import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
   
   // Change plugins array:
   const plugins = [react(), tailwindcss(), jsxLocPlugin()];
   ```

2. **Remove from `package.json`**:
   ```bash
   pnpm remove vite-plugin-manus-runtime
   ```

3. **Update `client/src/_core/hooks/useAuth.ts`**:
   ```typescript
   // Remove the manus-runtime localStorage line:
   // localStorage.setItem("manus-runtime-user-info", JSON.stringify(meQuery.data));
   ```

---

## Environment Variables Summary

### Variables to Remove

```bash
# Manus OAuth
OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL

# Manus Forge API
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL

# Manus App Identity
VITE_APP_ID
OWNER_OPEN_ID
```

### Variables to Add

```bash
# Authentication (choose one)
# Option A: Firebase (already partially configured)
FIREBASE_ADMIN_SDK_KEY=base64_encoded_service_account_json

# Option B: Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GEMINI_API_KEY=your_google_ai_key
OPENAI_API_KEY=sk-your_openai_key  # For Whisper and DALL-E

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_key

# Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=meditriage-storage

# Notifications
RESEND_API_KEY=re_your_key
OWNER_EMAIL=admin@yourdomain.com

# Keep existing
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
VITE_STRIPE_PUBLISHABLE_KEY=your_publishable_key
NCBI_API_KEY=your_ncbi_key
UTS_API_KEY=your_uts_key
OPENWEATHER_API_KEY=your_weather_key
```

---

## Migration Checklist

### Phase 1: Core Services (Required)
- [ ] Set up direct Gemini API access
- [ ] Configure AWS S3 or Cloudflare R2 for storage
- [ ] Implement Firebase Auth or alternative
- [ ] Update database schema for new user IDs

### Phase 2: Secondary Services (Recommended)
- [ ] Configure OpenAI Whisper for voice transcription
- [ ] Set up Google Maps API key
- [ ] Implement email notifications via SendGrid/Resend

### Phase 3: Cleanup (Optional)
- [ ] Remove `vite-plugin-manus-runtime`
- [ ] Remove unused Manus-specific environment variables
- [ ] Update documentation and deployment scripts
- [ ] Test all features end-to-end

---

## Estimated Effort

| Task | Time Estimate | Priority |
|------|---------------|----------|
| Authentication migration | 2-3 days | Critical |
| LLM API switch | 1-2 hours | Critical |
| Storage migration | 4-8 hours | Critical |
| Voice transcription | 1-2 hours | High |
| Maps API | 1-2 hours | Medium |
| Notifications | 2-4 hours | Medium |
| Image generation | 1-2 hours | Low |
| Testing & debugging | 2-3 days | Critical |

**Total Estimated Time: 5-7 days** for a complete migration

---

## Support Resources

- [Google AI Studio Documentation](https://ai.google.dev/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Resend Email API](https://resend.com/docs)

---

*Document generated by Manus AI for MediTriage AI self-hosting migration*
