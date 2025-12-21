# Firebase Domain Authorization Setup - URGENT FIX NEEDED

## 🔴 Critical Issue
Firebase authentication is failing with `auth/unauthorized-domain` error because **the current Manus development domain has changed** and is not authorized in Firebase Console.

## Current Domains Status

### ✅ Already Added (from screenshot):
```
3000-ipikazuzldtae1sxeriaq-ef606395.manus-asia.computer
```

### ❌ **MISSING - Current Active Domain:**
```
3000-ifhz2snq11y44i4wphv4f-33e916fa.manus-asia.computer
```

This is why you're getting `auth/unauthorized-domain` errors!

## Quick Fix (2 minutes)

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **My Doctor طبيبي** (formerly MediTriage AI Pro)

### Step 2: Navigate to Authentication Settings
1. Click on **Authentication** in the left sidebar
2. Click on the **Settings** tab
3. Scroll down to **Authorized domains** section

### Step 3: Add Development Domain
1. Click **Add domain** button
2. Enter the following domain:
   ```
   3000-ifhz2snq11y44i4wphv4f-33e916fa.manus-asia.computer
   ```
3. Click **Add**

### Step 4: Add Wildcard Domain (HIGHLY RECOMMENDED)
To avoid this issue every time the Manus sandbox URL changes:
1. Click **Add domain** button again
2. Enter:
   ```
   *.manus-asia.computer
   ```
3. Click **Add**

**Note:** This wildcard will authorize ALL Manus subdomains automatically, so you won't need to add domains manually again.

### Step 5: Add Production Domain (When Published)
When you publish your app, you'll need to add your production domain:
1. Click **Add domain** button
2. Enter your custom domain (e.g., `meditriage.com`)
3. Click **Add**

## What This Fixes

After adding the domain, these errors will be resolved:
- ✅ **Error 4:** `Firebase: Error (auth/unauthorized-domain)` for Google OAuth
- ✅ **Error 4:** `Firebase: Error (auth/unauthorized-domain)` for Apple Sign In
- ✅ All Firebase popup-based authentication methods

## Other Errors Fixed in Code

The following errors have been fixed in the codebase:
- ✅ **Error 2 & 3:** JWT `expiresIn` error - Fixed in `oauth-router.ts`
- ✅ **Error 1:** Email-already-in-use - Better error message added

## Verification Steps

After adding the domain:
1. **Clear browser cache** (Ctrl+Shift+Delete) or use Incognito/Private window
2. Go to your application homepage
3. Try logging in with:
   - ✅ Google OAuth (should work now)
   - ✅ Apple Sign In (should work now)
   - ✅ Email/Password (already working)
   - ✅ SMS Authentication (already working)

## Why This Happens

Manus development domains change when:
- The sandbox is restarted
- A new session is created
- The deployment URL is regenerated

**Solution:** Adding the wildcard domain `*.manus-asia.computer` prevents this issue permanently.

## Common Issues

### Issue: Wildcard not working
- Some Firebase projects don't support wildcards in free tier
- Solution: Add the specific domain manually

### Issue: Domain still unauthorized after adding
- **Wait 1-2 minutes** for Firebase to propagate changes
- Clear browser cache and cookies
- Try in an incognito/private window
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Error persists after adding wildcard
- Wildcard might not be supported in your Firebase plan
- **Solution:** Add the exact domain manually:
  ```
  3000-ifhz2snq11y44i4wphv4f-33e916fa.manus-asia.computer
  ```

### Issue: Production domain not working
- Ensure you've added the exact domain without `http://` or `https://`
- Add both `www.yourdomain.com` and `yourdomain.com` if needed

## Security Note

Firebase's authorized domains feature is a security measure to prevent unauthorized websites from using your Firebase authentication. Only add domains you control and trust.
