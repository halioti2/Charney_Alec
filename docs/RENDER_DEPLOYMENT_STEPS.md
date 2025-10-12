# Render Deployment - Step-by-Step Guide

## ✅ Pre-Deployment Checklist

Before deploying, make sure you have:

- [x] Code pushed to GitHub ✅ (Done!)
- [x] `render.yaml` file created ✅ (Done!)
- [x] `build.sh` file created ✅ (Done!)
- [x] `gunicorn` added to requirements.txt ✅ (Done!)
- [ ] OpenAI API key ready
- [ ] Render account created

---

## 🚀 Deployment Steps (15 minutes)

### Step 1: Create Render Account (2 minutes)

1. **Go to:** https://render.com
2. **Click:** "Get Started" button
3. **Sign up with GitHub** (recommended):
   - Click "Sign up with GitHub"
   - Authorize Render to access your repositories
   - ✅ Done!

**Alternative:** Sign up with email if you prefer

---

### Step 2: Connect Your Repository (3 minutes)

1. **In Render Dashboard**, click **"New +"** button (top right)
2. Select **"Blueprint"**
3. **Connect GitHub repository:**
   - If first time: Click "Connect GitHub"
   - Authorize Render to access your repos
   - Search for: `CharneyCommisionTracker`
   - Click **"Connect"**

4. **Select branch:** `feature/database` (or `main` if merged)
5. **Blueprint detected:** Render will find your `render.yaml` file
6. Click **"Apply"**

---

### Step 3: Configure Environment Variables (5 minutes)

Render will show you the services to be created. Before deploying:

1. **Click on the service name:** `charney-commission-tracker`
2. **Go to "Environment" tab**
3. **Add your OpenAI API key:**
   - Find: `OPENAI_API_KEY`
   - Click "Edit"
   - Paste your API key (starts with `sk-...`)
   - Click "Save"

**All other environment variables are already configured in `render.yaml`!**

---

### Step 4: Deploy! (5 minutes)

1. **Click "Create Web Service"** or **"Deploy"**
2. **Watch the build process:**
   - Installing dependencies
   - Running build.sh
   - Initializing database
   - Starting server

3. **Wait for deployment** (usually 3-5 minutes)
4. **Look for:** "Your service is live 🎉"

---

### Step 5: Get Your URL

Once deployed, Render gives you a URL:

```
https://charney-commission-tracker.onrender.com
```

**Copy this URL** - you'll need it for n8n!

---

### Step 6: Test Your Deployment (2 minutes)

**Test the health endpoint:**

```bash
curl https://charney-commission-tracker.onrender.com/api/v1/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "0.1.0"
}
```

**✅ If you see this, your API is live!**

---

## 🔧 Configure n8n to Use Deployed API

Now update your n8n workflow to use the deployed API:

### In n8n:

1. **Open your workflow**
2. **Click on "Parse Commission" node** (HTTP Request)
3. **Update the URL:**
   - Old: `http://localhost:5000/api/v1/parse`
   - New: `https://charney-commission-tracker.onrender.com/api/v1/parse`
4. **Save the workflow**

**✅ Now n8n will send emails to your deployed API!**

---

## 📊 Monitor Your Deployment

### View Logs

1. **In Render Dashboard**, click on your service
2. **Go to "Logs" tab**
3. **See real-time logs** of your application

### View Metrics

1. **Go to "Metrics" tab**
2. **See:**
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### View Events

1. **Go to "Events" tab**
2. **See:**
   - Deployments
   - Restarts
   - Errors

---

## 🔄 Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub!

**How it works:**
1. You make changes to your code
2. Commit and push to GitHub
3. Render detects the change
4. Automatically rebuilds and redeploys
5. Your API is updated!

**To disable auto-deploy:**
1. Go to service settings
2. Turn off "Auto-Deploy"

---

## 💾 Database Persistence

### SQLite (Current Setup)

Your database is stored on a **persistent disk** (1GB):
- Location: `/opt/render/project/src/commissions.db`
- Survives restarts and redeployments
- Backed up by Render

### Upgrade to PostgreSQL (When Ready)

1. **Uncomment the database section** in `render.yaml`:
   ```yaml
   databases:
     - name: charney-commission-db
       databaseName: commissions
       user: charney_user
       plan: free
   ```

2. **Update DATABASE_URL** environment variable:
   - Render will provide: `postgresql://...`
   - Update in environment variables

3. **Redeploy**

---

## 🐛 Troubleshooting

### Build Failed

**Check build logs:**
1. Go to "Logs" tab
2. Look for error messages
3. Common issues:
   - Missing dependencies
   - Python version mismatch
   - Database initialization error

**Solutions:**
- Verify `requirements.txt` is correct
- Check `build.sh` runs successfully locally
- Ensure all files are committed to Git

### Service Won't Start

**Check runtime logs:**
1. Go to "Logs" tab
2. Look for startup errors
3. Common issues:
   - Missing OPENAI_API_KEY
   - Port binding issues
   - Database connection errors

**Solutions:**
- Verify environment variables are set
- Check FLASK_PORT is set to 10000
- Verify database path is correct

### API Returns 500 Error

**Check application logs:**
1. Go to "Logs" tab
2. Look for Python errors
3. Common issues:
   - OpenAI API key invalid
   - Database write errors
   - Missing configuration

**Solutions:**
- Verify OpenAI API key is correct
- Check database disk is mounted
- Review environment variables

### Slow Response Times

**Free tier limitations:**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Subsequent requests are fast

**Solutions:**
- Upgrade to paid plan ($7/month) for always-on
- Use a ping service to keep it awake
- Accept the cold start for MVP

---

## 💰 Cost Breakdown

### Free Tier (Perfect for MVP)

**Included:**
- ✅ 750 hours/month (enough for 24/7)
- ✅ 1GB persistent disk
- ✅ Automatic SSL
- ✅ Custom domain support
- ✅ Auto-deploy from GitHub

**Limitations:**
- ⚠️ Spins down after 15 min inactivity
- ⚠️ 512MB RAM
- ⚠️ Shared CPU

**Cost:** $0/month

### Paid Tier (When You Need More)

**Starter Plan - $7/month:**
- ✅ Always-on (no spin down)
- ✅ 512MB RAM
- ✅ Shared CPU
- ✅ Everything from free tier

**Standard Plan - $25/month:**
- ✅ 2GB RAM
- ✅ Dedicated CPU
- ✅ Better performance

---

## 📈 Scaling Your Application

### When to Upgrade

**Upgrade from Free to Paid when:**
- Cold starts are annoying users
- You have consistent traffic
- You need better performance
- You're ready for production

**Upgrade to PostgreSQL when:**
- SQLite feels limiting
- You need better query performance
- You want better backup/restore
- You're scaling to multiple servers

### How to Upgrade

**Upgrade Plan:**
1. Go to service settings
2. Click "Change Plan"
3. Select new plan
4. Confirm

**Upgrade to PostgreSQL:**
1. Uncomment database in `render.yaml`
2. Push to GitHub
3. Render creates database automatically
4. Update DATABASE_URL
5. Migrate data (if needed)

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] API health check returns 200 OK
- [ ] Test parse endpoint with sample email
- [ ] Verify data is stored in database
- [ ] Update n8n workflow with new URL
- [ ] Test end-to-end: email → n8n → API → database
- [ ] Share URL with team
- [ ] Set up monitoring/alerts (optional)
- [ ] Document the deployment URL

---

## 🎉 Success!

Your Commission Tracker is now live on the internet!

**Your API URL:**
```
https://charney-commission-tracker.onrender.com/api/v1
```

**What you can do now:**
1. ✅ Process commission emails from anywhere
2. ✅ Share API with team members
3. ✅ Build a dashboard that connects to the API
4. ✅ Demo to stakeholders
5. ✅ Scale as needed

---

## 📞 Need Help?

**Render Support:**
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

**Your Documentation:**
- Deployment guide: `docs/DEPLOYMENT_GUIDE.md`
- API documentation: `README.txt`
- n8n integration: `docs/N8N_INTEGRATION_GUIDE.md`

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Your Service:** https://dashboard.render.com/web/[your-service-id]
- **API URL:** https://charney-commission-tracker.onrender.com
- **GitHub Repo:** https://github.com/halioti2/CharneyCommisionTracker

---

**Ready to deploy? Follow the steps above and you'll be live in 15 minutes!** 🚀

