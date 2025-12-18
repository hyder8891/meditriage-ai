# MediTriage AI Pro - Required API Keys

This document lists all API keys required to run the MediTriage AI Pro application.

## Required API Keys

### 1. **DeepSeek API Key** (REQUIRED)
- **Environment Variable:** `DEEPSEEK_API_KEY`
- **Purpose:** Powers the clinical reasoning engine, differential diagnosis generation, drug interaction analysis, and medical training processing
- **Where to Get:** [https://platform.deepseek.com/](https://platform.deepseek.com/)
- **Usage:**
  - Clinical Reasoning Engine (differential diagnosis)
  - PharmaGuard drug interaction checker
  - Admin training system (processing medical literature)
  - Patient symptom analysis
- **Cost:** Pay-per-use (very affordable, ~$0.14 per million input tokens)

### 2. **Gemini API Key** (REQUIRED)
- **Environment Variable:** `GEMINI_API_KEY`
- **Purpose:** Frontend AI operations including X-ray analysis and supplementary medical analysis
- **Where to Get:** [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
- **Usage:**
  - X-ray image analysis
  - Supplementary medical reasoning
  - Patient-facing symptom analysis
- **Cost:** Free tier available with generous limits

## Built-in Services (NO API KEY NEEDED)

The following services are provided by the Manus platform and **do not require separate API keys**:

### 3. **Voice Transcription (Whisper API)**
- **Environment Variable:** `BUILT_IN_FORGE_API_KEY` (automatically provided)
- **Purpose:** Powers Live Scribe voice-to-text transcription
- **Provided By:** Manus platform
- **Usage:**
  - Live Scribe real-time transcription
  - Voice input in triage sessions
- **Cost:** Included in Manus platform

### 4. **Database (MySQL/TiDB)**
- **Environment Variable:** `DATABASE_URL` (automatically provided)
- **Purpose:** Stores all application data
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform

### 5. **File Storage (S3)**
- **Environment Variable:** S3 credentials (automatically provided)
- **Purpose:** Stores medical documents, X-rays, audio recordings, training materials
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform

### 6. **Authentication (OAuth)**
- **Environment Variables:** `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` (automatically provided)
- **Purpose:** User authentication and session management
- **Provided By:** Manus platform
- **Cost:** Included in Manus platform

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

## Cost Estimates

Based on typical usage:

| Service | Monthly Cost (Estimated) |
|---------|-------------------------|
| DeepSeek API | $5-20 (depending on usage) |
| Gemini API | Free tier sufficient for most use cases |
| Manus Platform | Included in subscription |
| **Total** | **$5-20/month** |

## Testing Without API Keys

You can test the application UI and navigation without API keys, but the following features will not work:
- Clinical Reasoning Engine (differential diagnosis)
- PharmaGuard drug interaction checker
- Patient symptom analysis
- Live Scribe voice transcription
- X-ray analysis
- Admin training system

## Support

For issues with:
- **DeepSeek API:** Contact DeepSeek support at [https://platform.deepseek.com/](https://platform.deepseek.com/)
- **Gemini API:** Visit Google AI Studio support
- **Manus Platform:** Submit a request at [https://help.manus.im](https://help.manus.im)

## Quick Start Checklist

- [ ] Sign up for DeepSeek API account
- [ ] Get DeepSeek API key
- [ ] Sign up for Google AI Studio
- [ ] Get Gemini API key
- [ ] Add both keys to Manus project secrets
- [ ] Test clinical reasoning feature
- [ ] Test Live Scribe transcription
- [ ] Verify all features working

---

**Last Updated:** December 2024
