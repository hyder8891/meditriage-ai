# MediTriage AI Pro - Required API Keys

This document lists all API keys required to run the MediTriage AI Pro application.

## ✅ Required API Keys (YOU MUST PROVIDE)

### 1. **DeepSeek API Key** ⭐ REQUIRED
- **Environment Variable:** `DEEPSEEK_API_KEY`
- **Purpose:** Powers the clinical reasoning engine, differential diagnosis generation, drug interaction analysis, SOAP note generation, and medical training processing
- **Where to Get:** [https://platform.deepseek.com/](https://platform.deepseek.com/)
- **Usage:**
  - Clinical Reasoning Engine (differential diagnosis)
  - PharmaGuard drug interaction checker
  - Smart Clinical Notes Generator (SOAP notes)
  - Admin training system (processing medical literature)
  - Patient symptom analysis
- **Cost:** Pay-per-use (very affordable, ~$0.14 per million input tokens)
- **Format:** Starts with `sk-`

### 2. **Gemini API Key** ⭐ REQUIRED
- **Environment Variable:** `GEMINI_API_KEY`
- **Purpose:** X-ray image analysis and medical image understanding
- **Where to Get:** [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) or [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Usage:**
  - X-ray image analysis
  - Medical imaging interpretation
  - Visual diagnostic support
- **Cost:** Free tier available with generous limits (15 requests per minute)
- **Format:** Starts with `AIza`

## ✅ Built-in Services (NO API KEY NEEDED - AUTOMATICALLY PROVIDED)

The following services are provided by the Manus platform and **do not require you to obtain any API keys**:

### 3. **LLM Services (OpenAI-compatible)**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided by Manus)
- **Purpose:** Powers general AI operations, chat, and reasoning
- **Provided By:** Manus platform
- **Usage:**
  - General clinical reasoning
  - Chat interfaces
  - AI-powered features
- **Cost:** Included in Manus platform subscription
- **Note:** This is separate from DeepSeek/Gemini - used for general AI operations

### 4. **Voice Transcription (Whisper API)**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** Powers Live Scribe voice-to-text transcription
- **Provided By:** Manus platform
- **Usage:**
  - Live Scribe real-time transcription
  - Voice input in triage sessions
- **Cost:** Included in Manus platform subscription

### 5. **Image Generation**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** AI image generation capabilities
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

### 6. **Google Maps Integration**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** Care Locator facility mapping
- **Provided By:** Manus platform (proxied Google Maps API)
- **Usage:**
  - Care Locator facility search
  - Hospital/clinic mapping
- **Cost:** Included in Manus platform subscription
- **Note:** No need for your own Google Maps API key

### 7. **Database (MySQL/TiDB)**
- **Environment Variable:** `DATABASE_URL` (automatically provided)
- **Purpose:** Stores all application data
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

### 8. **File Storage (S3)**
- **Environment Variable:** S3 credentials (automatically provided)
- **Purpose:** Stores medical documents, X-rays, audio recordings, training materials
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

### 9. **Authentication (OAuth)**
- **Environment Variables:** `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` (automatically provided)
- **Purpose:** User authentication and session management
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform subscription

## How to Add API Keys

### For Development (Local Testing)
1. Create a `.env` file in the project root
2. Add your API keys:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### For Production (Manus Platform)
1. Go to your project settings in the Manus dashboard
2. Navigate to **Settings → Secrets**
3. Add the following secrets:
   - `DEEPSEEK_API_KEY`: Your DeepSeek API key
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
| **DeepSeek API** | $5-20 (depending on usage) |
| **Gemini API** | Free tier sufficient for most use cases |
| **Manus Platform Services** | Included in subscription |
| **Total Out-of-Pocket** | **$5-20/month** |

**Note:** With DeepSeek and Gemini API keys, you have access to ALL features of MediTriage AI Pro. No other external API keys are needed.

## 🧪 Testing Without API Keys

You can test the application UI and navigation without API keys, but the following features will not work:

**Will NOT work without DeepSeek API key:**
- Clinical Reasoning Engine (differential diagnosis)
- PharmaGuard drug interaction checker
- Smart Clinical Notes Generator (SOAP notes)
- Patient symptom analysis
- Admin training system

**Will NOT work without Gemini API key:**
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
- **DeepSeek API:** Contact DeepSeek support at [https://platform.deepseek.com/](https://platform.deepseek.com/)
- **Gemini API:** Visit Google AI Studio support
- **Manus Platform:** Submit a request at [https://help.manus.im](https://help.manus.im)

## ⚡ Quick Start Checklist

### Step 1: Get Your API Keys
- [ ] Sign up for DeepSeek account at [https://platform.deepseek.com/](https://platform.deepseek.com/)
- [ ] Get DeepSeek API key (starts with `sk-`)
- [ ] Sign up for Google AI Studio at [https://aistudio.google.com/](https://aistudio.google.com/)
- [ ] Get Gemini API key (starts with `AIza`)

### Step 2: Add Keys to Manus
- [ ] Go to your Manus project dashboard
- [ ] Navigate to **Settings → Secrets**
- [ ] Add `DEEPSEEK_API_KEY` with your DeepSeek key
- [ ] Add `GEMINI_API_KEY` with your Gemini key

### Step 3: Test Features
- [ ] Test Clinical Reasoning Engine (requires DeepSeek)
- [ ] Test X-ray Analysis (requires Gemini)
- [ ] Test SOAP Note Generation (requires DeepSeek)
- [ ] Test Live Scribe transcription (works automatically)
- [ ] Test Care Locator maps (works automatically)

### That's It! 🎉
With just these 2 API keys, your MediTriage AI Pro is fully functional. All other services (voice transcription, maps, storage, auth) are provided by Manus automatically.

---

**Last Updated:** December 2024
