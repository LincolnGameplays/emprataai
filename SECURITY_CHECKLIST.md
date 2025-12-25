# 🔒 Emprata AI - Security Hardening Checklist

## Google Cloud Console API Key Restriction

> **⚠️ CRITICAL:** Without API key restrictions, malicious users can abuse your Firebase quota, leading to unexpected costs and service disruption.

---

## Step-by-Step Guide

### 1. Access Google Cloud Console

1. Go to: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Select your Firebase project from the dropdown (top-left)
3. Ensure you're in the correct project (check project ID matches your Firebase project)

---

### 2. Navigate to API Credentials

1. In the left sidebar, click **"APIs & Services"**
2. Click **"Credentials"**
3. You'll see a list of API keys

---

### 3. Identify Your Firebase Web API Key

1. Look for the API key labeled **"Browser key (auto created by Firebase)"** or similar
2. This is typically the key used in your `firebase.config.ts` file
3. Click on the **key name** to edit it

---

### 4. Set Application Restrictions

1. Under **"Application restrictions"**, select:

   - ✅ **HTTP referrers (web sites)**

2. Click **"Add an item"** and add the following referrers:

   ```
   localhost/*
   http://localhost/*
   https://localhost/*
   emprata-ai.vercel.app/*
   https://emprata-ai.vercel.app/*
   *.vercel.app/*
   ```

3. **Important Notes:**
   - The `*` wildcard allows all paths on that domain
   - Include both `http` and `https` for localhost (development)
   - Include `*.vercel.app/*` to support preview deployments
   - If you have a custom domain, add it here as well

---

### 5. Set API Restrictions

1. Scroll down to **"API restrictions"**
2. Select **"Restrict key"**
3. Click **"Select APIs"** dropdown
4. Enable ONLY the following APIs:

   ✅ **Required APIs:**

   - **Identity Toolkit API** (Firebase Authentication)
   - **Cloud Firestore API** (Firestore Database)
   - **Cloud Storage for Firebase API** (Firebase Storage)
   - **Firebase Management API** (Optional, for admin operations)

   ❌ **Disable all other APIs**

5. If any of these APIs are not listed:
   - Go back to **"APIs & Services" → "Library"**
   - Search for the API name
   - Click **"Enable"**
   - Return to Credentials and add it to restrictions

---

### 6. Save Changes

1. Scroll to the bottom
2. Click **"Save"**
3. Wait for confirmation message: "API key updated"

---

### 7. Verify Restrictions (Testing)

1. **Test from allowed domain:**

   - Deploy to Vercel or run locally
   - Try logging in → Should work ✅

2. **Test from unauthorized domain:**
   - Open browser DevTools console
   - Try to make a Firebase request from a different domain
   - Should see error: `API key not valid. Please pass a valid API key.` ✅

---

## Additional Security Measures

### Enable Firebase App Check (Recommended)

1. Go to Firebase Console: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Select your project
3. Click **"Build" → "App Check"**
4. Click **"Get started"**
5. Register your web app
6. Choose **reCAPTCHA v3** as the provider
7. Add your domain to the allowed list
8. Click **"Save"**

This adds an extra layer of protection against abuse.

---

### Firestore Security Rules (Already Implemented)

Ensure you've deployed the `firestore.rules` file:

```bash
firebase deploy --only firestore:rules
```

Verify rules are active in Firebase Console:

1. Go to **Firestore Database**
2. Click **"Rules"** tab
3. Confirm the rules match your `firestore.rules` file

---

## Troubleshooting

### "API key not valid" error on production

**Solution:** Add your production domain to the HTTP referrers list in step 4.

### Firebase Auth not working after restrictions

**Solution:** Ensure "Identity Toolkit API" is enabled in step 5.

### Vercel preview deployments failing

**Solution:** Add `*.vercel.app/*` to the referrers list to allow all preview URLs.

---

## Final Checklist

- [ ] API key restricted to specific domains (localhost + production)
- [ ] Only required APIs are enabled (Auth, Firestore, Storage)
- [ ] Firestore security rules deployed
- [ ] Tested login on production domain
- [ ] (Optional) Firebase App Check enabled

---

**🎯 Once completed, your Firebase project is production-ready and secure!**
