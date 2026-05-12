# Deployment Guide

## Option 1: Deploy Backend on Render (Recommended - Free)

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub (github.com/new)

   - Name: `todo-app-backend`
   - Make it public or private

2. In your project folder:

```bash
cd C:\Users\GAURAV\AndroidStudioProjects\TodoApp
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/todo-app-backend.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account and select the repository
4. Configure:

   - Name: `todo-backend`
   - Build Command: (leave empty)
   - Start Command: `node server.js`
   - Free tier will be selected automatically

5. Click "Create Web Service"

### Step 3: Add Environment Variables

In Render dashboard for your web service:

1. Go to "Environment" tab
2. Add these variables:
   - `KEY`: `USE_ONLINE_DB`, Value: `true`
   - `KEY`: `DATABASE_URL`, Value: (see below)

### Step 4: Connect Online Database (Choose One)

#### Option A: Use Render's Free PostgreSQL (Easiest)

1. In Render dashboard: New → PostgreSQL
2. Create free database
3. Copy the "Internal Database URL" (starts with `postgres://`)
4. Add to your backend's environment variables:
   - `USE_ONLINE_DB`: `true`
   - `DATABASE_URL`: (the postgres URL)

> Note: You'll need to update `database.js` to use `pg` library instead of `sqlite3` for PostgreSQL.

#### Option B: Use SQLite Cloud (Keep SQLite)

1. Go to https://sqlitecloud.io
2. Sign up and create free account
3. Create new database
4. Copy connection string
5. Add to Render environment variables

---

## Option 2: Deploy Backend + Database on a VPS

### Using Railway (railway.app)

1. Sign up at railway.app
2. Click "New Project" → "Empty Project"
3. Add service: "Database" → "PostgreSQL"
4. Add service: "GitHub Repo" (connect your repo)
5. In backend service, add environment variable:
   - `DATABASE_URL`: (copy from PostgreSQL service)

---

## Step 5: Update Frontend to Connect to Deployed Backend

Edit `src/apollo.ts`:

```typescript
// Replace this line:
const GRAPHQL_ENDPOINT = 'http://192.168.0.156:3000/graphql';

// With your deployed URL (from Render):
const GRAPHQL_ENDPOINT = 'https://todo-backend-xxxx.onrender.com/graphql';
```

---

## Step 6: Build Android APK

```bash
cd C:\Users\GAURAV\AndroidStudioProjects\TodoApp
npm install
npx react-native build-android --mode=release
```

The APK will be in: `android/app/build/outputs/apk/release/`

---

## Quick Troubleshooting

| Issue               | Solution                                     |
| ------------------- | -------------------------------------------- |
| CORS errors         | Update backend's cors() to allow your domain |
| Database connection | Check DATABASE_URL is correct                |
| Token errors        | Clear AsyncStorage in app                    |
| APK not connecting  | Ensure GRAPHQL_ENDPOINT is HTTPS             |

---

## Files Modified for Deployment

1. `backend/package.json` - Added start script
2. `backend/Procfile` - For Render deployment
3. `backend/database.js` - Support for online DB
4. `src/apollo.ts` - Configurable endpoint
5. `src/MainScreen.tsx` - GraphQL queries
6. `src/screens/AuthScreen.tsx` - GraphQL mutations
7. `App.tsx` - Apollo Provider setup
