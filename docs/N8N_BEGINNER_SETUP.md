# n8n Setup Guide for Beginners

## 🎯 What is n8n?

n8n (pronounced "n-eight-n") is a **visual workflow automation tool** that lets you connect different services together without writing code. Think of it like a flowchart where each box does something (read email, call an API, send a notification).

### Why We're Using It

Instead of writing code to fetch emails, we'll use n8n's visual interface to:
1. Monitor your email inbox
2. Extract commission data from emails
3. Send it to your Commission Tracker API
4. Get notifications when done

**Best part:** You can see and modify the workflow visually - no coding required!

---

## 📋 Prerequisites

✅ **You have:** Node.js v22.14.0 (confirmed)  
✅ **You need:** 
- Your Commission Tracker API running (we'll start it)
- An email account to monitor (Gmail recommended)
- About 30 minutes

---

## 🚀 Step-by-Step Setup

### Step 1: Start Your Commission Tracker API (5 minutes)

First, let's make sure your API is running so n8n can talk to it.

**1.1 Open a NEW terminal/PowerShell window** (keep it separate from n8n)

**1.2 Navigate to your project:**
```powershell
cd C:\Users\ricar\CharneyCommisionTracker
```

**1.3 Activate your virtual environment:**
```powershell
.\venv\Scripts\Activate.ps1
```

**1.4 Start the API:**
```powershell
python run.py
```

You should see:
```
✓ Configuration validated successfully
✓ Database initialized successfully
✓ Flask application started successfully

Commission Tracker API is running!
Access the API at: http://localhost:5000/api/v1
```

**✅ Leave this terminal running!** Don't close it.

**1.5 Test the API** (open another terminal):
```powershell
curl http://localhost:5000/api/v1/health
```

You should see: `{"status": "healthy", ...}`

---

### Step 2: Install and Start n8n (5 minutes)

Now let's get n8n running.

**2.1 Open a NEW terminal/PowerShell window** (separate from the API)

**2.2 Navigate to your project:**
```powershell
cd C:\Users\ricar\CharneyCommisionTracker
```

**2.3 Start n8n using npx** (this will download and run n8n):
```powershell
npx n8n
```

**First time?** You'll see:
```
Need to install the following packages:
  n8n
Ok to proceed? (y)
```

Type `y` and press Enter.

**2.4 Wait for n8n to start** (30-60 seconds)

You'll see:
```
n8n ready on port 5678
Editor is now accessible via:
http://localhost:5678/
```

**✅ n8n is running!**

---

### Step 3: Open n8n in Your Browser (1 minute)

**3.1 Open your web browser** (Chrome, Edge, Firefox)

**3.2 Go to:**
```
http://localhost:5678
```

**3.3 First time setup:**

You'll see a welcome screen. n8n will ask you to create an account (this is local to your computer, not cloud):

- **Email:** Use any email (can be fake, it's just for login)
- **Password:** Choose a password
- Click **"Get Started"**

**✅ You're now in n8n!**

---

### Step 4: Import the Commission Parser Workflow (5 minutes)

Now let's import the pre-built workflow I created for you.

**4.1 In n8n, look at the left sidebar**

You'll see icons. Click on **"Workflows"** (looks like a flowchart icon)

**4.2 Click "Add Workflow"** dropdown → **"Import from File"**

**4.3 Browse to your project folder:**
```
C:\Users\ricar\CharneyCommisionTracker\n8n-workflows\commission-email-parser.json
```

**4.4 Select the file and click "Open"**

**4.5 Click "Import"**

**✅ You should now see a workflow with multiple connected nodes!**

It will look like a flowchart with boxes connected by lines:
```
[Email Trigger] → [Extract Email Data] → [Parse Commission] → [Check Confidence] → [Notifications]
```

---

### Step 5: Configure Email Credentials (10 minutes)

Now we need to tell n8n how to access your email.

**5.1 Click on the "Email Trigger" node** (the first box on the left)

**5.2 You'll see "Credentials" section**

Click **"Create New Credential"**

**5.3 Choose your email provider:**

#### Option A: Gmail (Recommended)

**Settings:**
- **Name:** My Gmail Account (or any name)
- **User:** your-email@gmail.com
- **Password:** See below for App Password

**Important for Gmail:** You need an "App Password" (not your regular password)

**How to get Gmail App Password:**

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Select **"Mail"** and **"Windows Computer"**
5. Click **"Generate"**
6. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)
7. Paste it in n8n's Password field (remove spaces)

**Advanced Settings (click to expand):**
- **Host:** imap.gmail.com
- **Port:** 993
- **Secure:** Yes (SSL/TLS)

#### Option B: Outlook/Hotmail

**Settings:**
- **User:** your-email@outlook.com
- **Password:** Your Outlook password or App Password
- **Host:** outlook.office365.com
- **Port:** 993
- **Secure:** Yes

#### Option C: Other IMAP Email

**Settings:**
- **User:** your-email@domain.com
- **Password:** Your email password
- **Host:** Ask your email provider (e.g., imap.domain.com)
- **Port:** Usually 993
- **Secure:** Yes

**5.4 Click "Save"**

**5.5 Click "Test Connection"** (if available)

If successful, you'll see a green checkmark ✅

---

### Step 6: Configure the Workflow (5 minutes)

Let's make sure the workflow is set up correctly.

**6.1 Check the "Parse Commission" node**

Click on the **"Parse Commission"** node (the HTTP Request node)

**Verify the URL is:**
```
http://localhost:5000/api/v1/parse
```

If your API is running on a different port, change it here.

**6.2 Configure Email Polling**

Click on the **"Email Trigger"** node again

**Settings to check:**
- **Mailbox:** INBOX (or the folder you want to monitor)
- **Post Process Action:** Mark as read (so it doesn't process the same email twice)
- **Poll Times:** Every minute (or your preference)

**6.3 Save the workflow**

Click **"Save"** button in the top right corner

Give it a name: **"Commission Email Parser"**

---

### Step 7: Test the Workflow (5 minutes)

Let's test it with a sample email!

**7.1 Send yourself a test commission email**

Open your email and send yourself an email with commission data. Here's a sample:

**Subject:** Commission Statement - Property Sale

**Body:**
```
Commission Statement

Transaction ID: TXN-2024-001
Property Address: 123 Main Street, Springfield, IL 62701
Sale Amount: $450,000
Commission Rate: 6%
Total Commission: $27,000
Closing Date: 2024-01-15

Agent Splits:
- John Smith (Listing Agent): 50% = $13,500
- Jane Doe (Buyer Agent): 50% = $13,500

Thank you for your business!
```

**7.2 Test the workflow manually**

In n8n, click the **"Execute Workflow"** button (play icon ▶️) at the bottom

**7.3 Watch it run!**

You'll see each node light up as it processes:
1. Email Trigger fetches the email
2. Extract Email Data pulls out the content
3. Parse Commission sends it to your API
4. Check Confidence evaluates the result
5. Notifications show the result

**7.4 Check the results**

Click on each node to see what data passed through it. The last node should show:
```
✅ Commission Processed Successfully!
Transaction ID: TXN-2024-001
...
```

**7.5 Verify in your database**

In a terminal, run:
```powershell
curl http://localhost:5000/api/v1/commissions
```

You should see your commission in the database!

---

### Step 8: Activate for Production (2 minutes)

Once testing works, let's make it run automatically.

**8.1 In n8n, look at the top right**

You'll see a toggle switch labeled **"Inactive"**

**8.2 Click the toggle to turn it "Active"**

It will turn green and say **"Active"**

**✅ Done!** n8n will now automatically check your email every minute and process new commission emails.

---

## 🎉 You're All Set!

### What Happens Now?

1. **Every minute**, n8n checks your email inbox
2. **When a new email arrives**, it extracts the content
3. **Sends it to your API** for AI parsing
4. **Stores it in the database**
5. **Shows you the result** in the workflow execution history

### How to Monitor

**View Execution History:**
1. In n8n, click **"Executions"** in the left sidebar
2. See all workflow runs (successful and failed)
3. Click any execution to see details

**Check Your Database:**
```powershell
curl http://localhost:5000/api/v1/commissions
```

---

## 🔧 Customization (Optional)

### Change Email Check Frequency

1. Click **"Email Trigger"** node
2. Change **"Poll Times"** to:
   - Every 5 minutes
   - Every hour
   - Custom schedule

### Add Slack Notifications

1. Delete the **"Log Success"** node
2. Add a **"Slack"** node
3. Connect it after **"Format Success Message"**
4. Configure with your Slack webhook

### Adjust Confidence Threshold

1. Click **"High Confidence?"** node
2. Change the value from `0.7` to your preference:
   - `0.5` = 50% confidence (more lenient)
   - `0.9` = 90% confidence (more strict)

---

## 🐛 Troubleshooting

### Problem: n8n won't start

**Solution:**
```powershell
# Try with a specific port
npx n8n --port 5678

# Or install globally
npm install n8n -g
n8n
```

### Problem: Email credentials not working

**Gmail:**
- Make sure 2-Step Verification is enabled
- Use App Password, not regular password
- Remove spaces from the App Password

**Other providers:**
- Check IMAP is enabled in your email settings
- Verify host and port are correct
- Try with SSL/TLS enabled

### Problem: API connection failed

**Check API is running:**
```powershell
curl http://localhost:5000/api/v1/health
```

**If not running:**
```powershell
cd C:\Users\ricar\CharneyCommisionTracker
.\venv\Scripts\Activate.ps1
python run.py
```

### Problem: Workflow not triggering automatically

**Check:**
1. Workflow is **Active** (toggle in top right)
2. Email credentials are saved
3. Email Trigger node is configured
4. n8n is still running (check the terminal)

### Problem: Low confidence scores

**Solutions:**
1. Check email format is clear
2. Review the email content in the workflow execution
3. Lower the confidence threshold temporarily
4. Check API logs: `logs/app.log`

---

## 📚 Next Steps

### Learn More About n8n

- **n8n Documentation:** https://docs.n8n.io
- **n8n Community:** https://community.n8n.io
- **Video Tutorials:** https://www.youtube.com/c/n8n-io

### Enhance Your Workflow

1. **Add more email sources** (duplicate the workflow)
2. **Add notifications** (Slack, Teams, Email)
3. **Add approval workflows** for low confidence items
4. **Export data** to Google Sheets or Airtable

### Production Deployment

When ready for production:
1. Run n8n as a service (always on)
2. Use a production database (PostgreSQL)
3. Set up proper authentication
4. Configure backups

---

## 🆘 Need Help?

**During Setup:**
- Check the terminal for error messages
- Review the execution history in n8n
- Check API logs: `logs/app.log`

**After Setup:**
- Monitor executions in n8n dashboard
- Check database for new commissions
- Review confidence scores

**Resources:**
- This guide: `docs/N8N_BEGINNER_SETUP.md`
- Integration guide: `docs/N8N_INTEGRATION_GUIDE.md`
- Quick reference: `QUICK_REFERENCE.md`

---

## ✅ Setup Checklist

- [ ] Node.js installed (v22.14.0) ✅
- [ ] Commission Tracker API running
- [ ] n8n installed and running
- [ ] n8n account created
- [ ] Workflow imported
- [ ] Email credentials configured
- [ ] Workflow tested with sample email
- [ ] Commission appears in database
- [ ] Workflow activated
- [ ] Monitoring executions

**Once all checked, you're ready to process commission emails automatically!** 🎉

