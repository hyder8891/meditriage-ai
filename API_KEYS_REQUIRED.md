# My Doctor طبيبي - Required API Keys

This document lists all API keys required to run the My Doctor طبيبي application.

## ✅ Required API Keys (YOU MUST PROVIDE)

### 1. **Gemini API Key** ⭐ REQUIRED
- **Environment Variable:** `GEMINI_API_KEY`
- **Purpose:** Powers clinical reasoning, X-ray analysis, differential diagnosis, drug interaction analysis, SOAP note generation, and medical training processing
- **Where to Get:** [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) or [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Usage:**
  - Clinical Reasoning Engine (differential diagnosis)
  - X-ray image analysis
  - Medical imaging interpretation
  - PharmaGuard drug interaction checker
  - Smart Clinical Notes Generator (SOAP notes)
  - Admin training system (processing medical literature)
  - Patient symptom analysis
- **Cost:** Free tier available with generous limits (15 requests per minute)
- **Format:** Starts with `AIza`

## ✅ Built-in Services (NO API KEY NEEDED - AUTOMATICALLY PROVIDED)

The following services are provided by the Manus platform and **do not require you to obtain any API keys**:

### 2. **LLM Services (OpenAI-compatible)**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided by Manus)
- **Purpose:** Powers general AI operations, chat, and reasoning
- **Provided By:** Manus platform
- **Usage:**
  - General clinical reasoning
  - Chat interfaces
  - AI-powered features
- **Cost:** Included in Manus platform subscription

### 3. **Voice Transcription (Whisper API)**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** Powers Live Scribe voice-to-text transcription
- **Provided By:** Manus platform
- **Usage:**
  - Live Scribe real-time transcription
  - Voice input in triage sessions
- **Cost:** Included in Manus platform subscription

### 4. **Image Generation**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** AI image generation capabilities
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

### 5. **Google Maps Integration**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** Care Locator facility mapping
- **Provided By:** Manus platform (proxied Google Maps API)
- **Usage:**
  - Care Locator facility search
  - Hospital/clinic mapping
- **Cost:** Included in Manus platform subscription
- **Note:** No need for your own Google Maps API key

### 6. **Database (MySQL/TiDB)**
- **Environment Variable:** `DATABASE_URL` (automatically provided)
- **Purpose:** Stores all application data
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

### 7. **File Storage (S3)**
- **Environment Variable:** S3 credentials (automatically provided)
- **Purpose:** Stores medical documents, X-rays, audio recordings, training materials
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

### 8. **Authentication (OAuth)**
- **Environment Variables:** `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` (automatically provided)
- **Purpose:** User authentication and session management
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

## How to Add API Keys

### For Development (Local Testing)
1. Create a `.env` file in the project root
2. Add your API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### For Production (Manus Platform)
1. Go to your project settings in the Manus dashboard
2. Navigate to **Settings → Secrets**
3. Add the following secret:
   - `GEMINI_API_KEY`: Your Gemini API key

## API Key Security

- **NEVER** commit API keys to version control
- All API keys are stored server-side only
- Frontend never has direct access to API keys
- All AI operations go through backend tRPC endpoints

## 💰 Cost Summary

Based on typical usage:

| Service | Monthly Cost (Estimated) |
|---------|-------------------------|
| **Gemini API** | Free tier sufficient for most use cases |
| **Manus Platform Services** | Included in subscription |
| **Total Out-of-Pocket** | **$0/month** (with free tier) |

**Note:** With the Gemini API key, you have access to ALL features of My Doctor طبيبي. No other external API keys are needed.

## 🧪 Testing Without API Keys

You can test the application UI and navigation without API keys, but the following features will not work:

**Will NOT work without Gemini API key:**
- Clinical Reasoning Engine (differential diagnosis)
- PharmaGuard drug interaction checker
- Smart Clinical Notes Generator (SOAP notes)
- Patient symptom analysis
- Admin training system
- X-ray image analysis
- Medical imaging interpretation

**Will work (Manus platform provides these):**
- Live Scribe voice transcription
- Care Locator (Google Maps)
- File storage and uploads
- Authentication
- Database operations
- General AI chat features

## Support

For issues with:
- **Gemini API:** Visit Google AI Studio support
- **Manus Platform:** Submit a request at [https://help.manus.im](https://help.manus.im)

## ⚡ Quick Start Checklist

### Step 1: Get Your API Key
- [ ] Sign up for Google AI Studio at [https://aistudio.google.com/](https://aistudio.google.com/)
- [ ] Get Gemini API key (starts with `AIza`)

### Step 2: Add Key to Manus
- [ ] Go to your Manus project dashboard
- [ ] Navigate to **Settings → Secrets**
- [ ] Add `GEMINI_API_KEY` with your Gemini key

### Step 3: Test Features
- [ ] Test Clinical Reasoning Engine (requires Gemini)
- [ ] Test X-ray Analysis (requires Gemini)
- [ ] Test SOAP Note Generation (requires Gemini)
- [ ] Test Live Scribe transcription (works automatically)
- [ ] Test Care Locator maps (works automatically)

### That's It! 🎉
With just this 1 API key, your My Doctor طبيبي is fully functional. All other services (voice transcription, maps, storage, auth) are provided by Manus automatically.

---

**Last Updated:** December 2024
