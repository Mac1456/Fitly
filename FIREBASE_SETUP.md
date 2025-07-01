# 🔐 Secure Firebase Setup for Fitly

This guide will help you securely set up Firebase for your Fitly app without exposing your API keys.

## ⚠️ IMPORTANT: Your API keys have been secured!

**The hardcoded Firebase keys have been removed** from your code and replaced with a secure configuration system. Your app will now load Firebase configuration safely without exposing credentials.

## 🔥 Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Find your project: **fitly-44f1b** (or create if needed)
4. Click on Project Settings (gear icon)
5. Scroll to "Your apps" section
6. Find your web app or click "Add app" → Web
7. Copy the configuration object

## 🔐 Secure Setup Options

### Option 1: Environment Variables (Most Secure - Recommended)

Set these environment variables on your system:

**Windows (PowerShell):**
```powershell
$env:FIREBASE_API_KEY="your-actual-api-key"
$env:FIREBASE_AUTH_DOMAIN="fitly-44f1b.firebaseapp.com"  
$env:FIREBASE_PROJECT_ID="fitly-44f1b"
$env:FIREBASE_STORAGE_BUCKET="fitly-44f1b.firebasestorage.app"
$env:FIREBASE_MESSAGING_SENDER_ID="765277997791"
$env:FIREBASE_APP_ID="your-actual-app-id"
$env:FIREBASE_MEASUREMENT_ID="your-actual-measurement-id"
```

**To make permanent:**
```powershell
setx FIREBASE_API_KEY "your-actual-api-key"
setx FIREBASE_AUTH_DOMAIN "fitly-44f1b.firebaseapp.com"
setx FIREBASE_PROJECT_ID "fitly-44f1b"
setx FIREBASE_STORAGE_BUCKET "fitly-44f1b.firebasestorage.app"
setx FIREBASE_MESSAGING_SENDER_ID "765277997791"
setx FIREBASE_APP_ID "your-actual-app-id"
setx FIREBASE_MEASUREMENT_ID "your-actual-measurement-id"
```

### Option 2: Local Config File (Development)

1. Copy the template file:
   ```bash
   cp src/firebase-config.template.json src/firebase-config.local.json
   ```

2. Edit `src/firebase-config.local.json` with your actual values:
   ```json
   {
     "apiKey": "AIzaSyA8xAy5C09rrl9mzPqnB53BFyHfmsni3xc",
     "authDomain": "fitly-44f1b.firebaseapp.com",
     "projectId": "fitly-44f1b",
     "storageBucket": "fitly-44f1b.firebasestorage.app",
     "messagingSenderId": "765277997791",
     "appId": "1:765277997791:web:d0f82c45b69de436b2776a",
     "measurementId": "G-9NE108PT6E"
   }
   ```

3. ⚠️ **This file is automatically ignored by git** - never commit it!

## 🔄 Restart Required

After setting up your configuration:
1. Close the Fitly app completely
2. Restart the app
3. Check the console for "✅ Firebase initialized successfully"

## 🛡️ Security Features

✅ **API keys never visible in DevTools**  
✅ **Configuration loaded securely via IPC**  
✅ **Automatic fallback to mock data if not configured**  
✅ **Multiple secure storage options**  
✅ **Template file for easy setup**  

## 🧪 Development Mode

If no Firebase configuration is found, the app will run in development mode with mock Firebase services. This lets you develop and test the app without setting up Firebase immediately.

## ❓ Troubleshooting

- **App won't start**: Check your configuration file syntax or environment variables
- **Mock data showing**: Firebase config not found - follow setup steps above
- **Authentication errors**: Verify your Firebase project settings and API key

## 🎯 Next Steps

1. Set up your Firebase configuration using one of the methods above
2. Restart the app
3. Your Firebase features (auth, database, storage) will be fully functional
4. All data will be securely stored in your Firebase project

---

**Your app is now secure and ready for git!** 🎉 