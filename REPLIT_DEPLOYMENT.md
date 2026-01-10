# MediTriage AI - Replit Deployment Guide

## ⚠️ Important Notice

This project was built using **Manus platform** which provides built-in hosting with custom domain support. Deploying to Replit may require additional configuration and troubleshooting.

**Recommended:** Use Manus built-in hosting for seamless deployment.

---

## Prerequisites

1. **Replit Account** - Sign up at https://replit.com
2. **GitHub Repository** - Already created at https://github.com/hyder8891/meditriage-ai
3. **Database** - You'll need a MySQL database (Replit doesn't provide MySQL by default)
4. **Environment Variables** - See list below

---

## Step 1: Import GitHub Repository to Replit

1. Go to https://replit.com
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Enter repository URL: `https://github.com/hyder8891/meditriage-ai`
5. Click **"Import from GitHub"**

---

## Step 2: Configure Environment Variables

Go to **Secrets** tab (🔒 icon) in Replit and add these variables:

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-jwt-secret-here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Owner Configuration
OWNER_NAME=your-name
OWNER_OPEN_ID=your-open-id

# Redis (for sessions and caching)
REDIS_URL=redis://default:password@host:port

# Stripe Payment (if using payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Firebase (for notifications)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# AI API Keys
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key

# Medical Data APIs
NCBI_API_KEY=your-ncbi-key
UTS_API_KEY=your-uts-key

# App Configuration
VITE_APP_TITLE=MediTriage AI Pro
VITE_APP_LOGO=/logo.png
VITE_APP_ID=your-app-id

# Analytics (optional)
VITE_ANALYTICS_WEBSITE_ID=your-website-id
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint

# Forge API (Manus internal - may not work on Replit)
BUILT_IN_FORGE_API_KEY=your-forge-key
BUILT_IN_FORGE_API_URL=https://forge-api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_FRONTEND_FORGE_API_URL=https://forge-api.manus.im
```

---

## Step 3: Set Up External Database

Replit doesn't provide MySQL databases. You need to use an external service:

### Option A: PlanetScale (Recommended)
1. Sign up at https://planetscale.com
2. Create a new database
3. Get connection string
4. Add to `DATABASE_URL` in Replit Secrets

### Option B: Railway
1. Sign up at https://railway.app
2. Create MySQL database
3. Get connection string
4. Add to `DATABASE_URL` in Replit Secrets

### Option C: AWS RDS
1. Create MySQL instance on AWS RDS
2. Configure security groups
3. Get connection string
4. Add to `DATABASE_URL` in Replit Secrets

---

## Step 4: Set Up Redis

Replit doesn't provide Redis. Use external service:

### Option A: Upstash (Recommended - Free Tier)
1. Sign up at https://upstash.com
2. Create Redis database
3. Get connection URL
4. Add to `REDIS_URL` in Replit Secrets

### Option B: Redis Cloud
1. Sign up at https://redis.com
2. Create database
3. Get connection URL
4. Add to `REDIS_URL` in Replit Secrets

---

## Step 5: Run Database Migrations

After setting up database:

1. Open Replit Shell
2. Run migrations:
```bash
pnpm install
pnpm db:push
```

---

## Step 6: Build and Deploy

### Development Mode
```bash
pnpm install
pnpm dev
```

### Production Mode
```bash
pnpm install
pnpm run build
pnpm start
```

---

## Step 7: Configure Replit Deployment

1. Click **"Deploy"** button in Replit
2. Choose deployment type (Autoscale recommended)
3. Set environment variables in deployment settings
4. Deploy!

---

## Known Issues & Limitations

### 1. **Manus-Specific Features May Not Work**
- OAuth integration with Manus portal
- Forge API endpoints
- Built-in analytics
- Some authentication flows

### 2. **WebSocket Connections**
- Socket.IO may need additional configuration
- Real-time features might require adjustments

### 3. **File Storage**
- S3 integration needs AWS credentials
- Medical document uploads need storage configuration

### 4. **Performance**
- Replit free tier has resource limitations
- Consider upgrading for production use

### 5. **Database Connections**
- External database may have latency
- Connection pooling needs tuning

---

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .pnpm-store
pnpm install
```

### TypeScript Errors
The project has some TypeScript errors that don't prevent runtime execution:
- Enhanced assessment type issues
- Medical records type mismatches
These can be ignored for deployment

### Port Issues
Replit uses port 3000 by default. The app is configured for this.

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database is accessible from Replit IP
- Ensure SSL is configured if required

---

## Alternative: Deploy to Manus (Recommended)

Instead of Replit, use Manus built-in hosting:

1. Return to Manus platform
2. Create a checkpoint
3. Click **"Publish"** button
4. Your app will be deployed with:
   - ✅ Automatic SSL
   - ✅ Custom domain support
   - ✅ Built-in database
   - ✅ All features working
   - ✅ No configuration needed

---

## Support

For issues specific to:
- **Replit deployment**: Contact Replit support
- **Manus platform**: Visit https://help.manus.im
- **Application bugs**: Check GitHub issues

---

## Repository

GitHub: https://github.com/hyder8891/meditriage-ai

---

**Good luck with your deployment! 🚀**
