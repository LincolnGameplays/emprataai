# Add Firebase SDK to package.json dependencies

```bash
npm install firebase
```

# Environment Variables (.env)

Add these Firebase configuration variables to your `.env` file:

```env
# Existing
VITE_GOOGLE_API_KEY=AIzaSyAFo1Hq5LuuaqkKLzZgUOl3PTtKk_cagVc
VITE_KIRVANO_CHECKOUT_URL=https://kirvano.com/checkout/SEU_CODIGO_AQUI

# Firebase Configuration (Add these)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

# Firestore Database Structure

## users/{uid}

```json
{
  "uid": "string",
  "email": "string",
  "plan": "FREE" | "PRO",
  "credits": number,
  "createdAt": timestamp,
  "lastPurchase": timestamp (optional)
}
```

## transactions/{id}

(Created by webhook - see previous deployment guide)

# Route Protection

Update your `App.tsx` to wrap `/app` route with `ProtectedRoute`:

```tsx
import { ProtectedRoute } from "./components/ProtectedRoute";

// In your routes:
<Route
  path="/app"
  element={
    <ProtectedRoute>
      <AppStudio />
    </ProtectedRoute>
  }
/>;
```

# Testing Checklist

- [ ] Install Firebase SDK: `npm install firebase`
- [ ] Add Firebase env variables
- [ ] Create Firebase project and enable Auth + Firestore
- [ ] Test login flow
- [ ] Test FREE user export (watermark visible)
- [ ] Test PRO user export (clean image)
- [ ] Test WhatsApp share on mobile
- [ ] Verify route protection works
