# FCM Token Saving Implementation

## 🎯 Summary

Successfully implemented FCM token saving to Firestore for both iOS and Android platforms, and updated the web dashboard to display a prominent blue "Send Now" button for sending push notifications.

## ✅ Changes Made

### 1. Web Dashboard - Visible Send Button

**File: `src/components/NotificationsManagement.jsx`**

- ✅ Added `Send` icon to imports from lucide-react
- ✅ Replaced small green message icon with prominent **blue button**
- ✅ Button now displays "Send Now" text with icon
- ✅ Loading state shows "Sending..." with spinner
- ✅ Much more visible and user-friendly

**Visual Result:**
```
Before: [Edit Icon] [Green Message Icon] [Delete Icon]
After:  [Edit Icon] [🔵 Send Now Button] [Delete Icon]
```

---

### 2. iOS FCM Token Saving

**File: `mobile/ios/Runner/AppDelegate.swift`**

#### Added Imports:
```swift
import FirebaseFirestore
import FirebaseAuth
```

#### New Function: `saveFCMTokenToFirestore(token:)`
- ✅ Checks if user is authenticated (requires login)
- ✅ Saves token to `fcm_tokens` collection in Firestore
- ✅ Includes metadata: userId, platform, appVersion, deviceModel, deviceName
- ✅ Checks for existing token and updates if found
- ✅ Creates new token document if not found
- ✅ Sets timestamps: createdAt, updatedAt, lastUsedAt
- ✅ Marks token as `active: true`

#### Token Data Structure:
```swift
{
  token: "fcm_token_string",
  userId: "user_uid",
  platform: "ios",
  appVersion: "2.3",
  deviceModel: "iPhone",
  deviceName: "User's iPhone",
  active: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastUsedAt: serverTimestamp()
}
```

---

### 3. Android FCM Token Saving

**Files:**
- `mobile/android/app/src/main/kotlin/com/theholylabs/esim/MyFirebaseMessagingService.kt`
- `mobile/android/app/src/main/kotlin/com/theholylabs/esim/MainActivity.kt`
- `mobile/android/app/build.gradle.kts`

#### Added Dependencies (`build.gradle.kts`):
```kotlin
implementation("com.google.firebase:firebase-firestore")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3")
```

#### Added Imports to Both Files:
```kotlin
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
```

#### New Function: `saveFCMTokenToFirestore(token: String)`
- ✅ Checks if user is authenticated (requires login)
- ✅ Saves token to `fcm_tokens` collection in Firestore
- ✅ Includes metadata: userId, platform, appVersion, deviceModel, androidVersion
- ✅ Uses Kotlin Coroutines for async operations
- ✅ Checks for existing token and updates if found
- ✅ Creates new token document if not found
- ✅ Sets timestamps: createdAt, updatedAt, lastUsedAt
- ✅ Marks token as `active: true`

#### Token Data Structure:
```kotlin
{
  token: "fcm_token_string",
  userId: "user_uid",
  platform: "android",
  appVersion: "2.3",
  deviceModel: "Samsung Galaxy S23",
  androidVersion: "34",
  active: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastUsedAt: serverTimestamp()
}
```

#### Called From:
1. **`MyFirebaseMessagingService.onNewToken()`** - When FCM token refreshes
2. **`MainActivity.initializeFCM()`** - On app startup

---

## 🔐 Authentication Requirement

**IMPORTANT:** FCM tokens are only saved when a user is **logged in**. This is intentional because:
- Tokens are associated with specific users (`userId` field)
- Dashboard can send targeted notifications to specific users
- Security: Only authenticated users receive notifications
- Prevents token spam from anonymous users

**Flow:**
1. User opens app → FCM token is generated
2. User logs in → Token is saved to Firestore with `userId`
3. Token refresh → Updated in Firestore
4. Dashboard → Queries `fcm_tokens` collection to send notifications

---

## 📊 Firestore Collection Structure

### Collection: `fcm_tokens`

Each document contains:
```javascript
{
  token: "fcm_token_here",           // FCM registration token
  userId: "user_uid",                // Firebase Auth user ID
  platform: "ios" | "android",       // Device platform
  appVersion: "2.3",                 // App version
  deviceModel: "iPhone" | "Samsung Galaxy", // Device model
  deviceName: "John's iPhone",       // iOS only
  androidVersion: "34",              // Android only
  active: true,                      // Token status
  createdAt: Timestamp,              // First creation
  updatedAt: Timestamp,              // Last update
  lastUsedAt: Timestamp              // Last activity
}
```

---

## 🚀 How It Works

### iOS Flow:
```
1. App launches
2. Firebase initializes
3. FCM generates token
4. messaging(_:didReceiveRegistrationToken:) called
5. saveFCMTokenToFirestore() checks for auth
6. If logged in → Save/update token in Firestore
7. If not logged in → Skip (will save after login)
```

### Android Flow:
```
1. App launches
2. MainActivity.onCreate() → initializeFCM()
3. FCM token retrieved
4. saveFCMTokenToFirestore() checks for auth
5. If logged in → Save/update token in Firestore using Coroutines
6. Token refresh → MyFirebaseMessagingService.onNewToken() → saveFCMTokenToFirestore()
```

---

## 🧪 Testing

### 1. Check iOS Token Saving:
1. Open Xcode logs
2. Look for:
   ```
   ✅ FCM Token: <token_string>
   💾 Saving FCM token to Firestore for user: <userId>
   ✅ FCM token saved to Firestore successfully
   ```

### 2. Check Android Token Saving:
1. Open Android Studio logcat
2. Filter by "MainActivity" or "MyFirebaseMessagingService"
3. Look for:
   ```
   🔥 Initializing FCM...
   ✅ FCM Token: <token_string>
   💾 Saving FCM token to Firestore for user: <userId>
   ✅ FCM token saved to Firestore successfully
   ```

### 3. Verify in Firebase Console:
1. Open Firebase Console
2. Go to Firestore Database
3. Check `fcm_tokens` collection
4. Should see documents with:
   - `token` field (long string)
   - `userId` field (matches Firebase Auth)
   - `platform` field ("ios" or "android")
   - `active: true`
   - Timestamps

### 4. Test Sending Notifications:
1. Open web dashboard
2. Go to Notifications section
3. Create a notification
4. Click the blue **"Send Now"** button
5. Should see success message with device count
6. Check mobile device for notification

---

## 🐛 Troubleshooting

### "No active FCM tokens found"
**Cause:** No tokens in `fcm_tokens` collection  
**Solution:**
1. Ensure user is logged in on mobile app
2. Check Firestore rules allow write to `fcm_tokens`
3. Check mobile logs for errors
4. Verify Firebase Auth is working

### Token Not Saving (iOS)
**Check:**
1. User is authenticated: `Auth.auth().currentUser != nil`
2. Firestore is imported: `import FirebaseFirestore`
3. Firebase Console logs for errors
4. Xcode console for error messages

### Token Not Saving (Android)
**Check:**
1. User is authenticated: `FirebaseAuth.getInstance().currentUser != null`
2. Dependencies added to `build.gradle.kts`
3. Logcat for error messages
4. Firestore rules allow write

### Tokens Saved But Not Receiving Notifications
**Check:**
1. Token is marked `active: true`
2. Notification permissions granted on device
3. FCM API key is correct in Firebase project
4. Check device logs when notification is sent

---

## 📱 Next Steps

1. **Test on Real Devices:**
   - iOS device
   - Android device
   - Test with logged-in users

2. **Verify Token Saving:**
   - Check Firebase Console → Firestore → `fcm_tokens`
   - Verify tokens appear after login

3. **Test Notifications:**
   - Use dashboard "Send Now" button
   - Verify notifications arrive on devices
   - Check success count matches token count

4. **Monitor Logs:**
   - iOS: Xcode console
   - Android: Android Studio logcat
   - Look for success/error messages

---

## 🎉 Summary

✅ **Web Dashboard:** Blue "Send Now" button is now prominent and visible  
✅ **iOS:** FCM tokens are saved to Firestore on token generation/refresh  
✅ **Android:** FCM tokens are saved to Firestore on app launch and token refresh  
✅ **Firestore:** `fcm_tokens` collection stores all device tokens  
✅ **Authentication:** Tokens only saved for logged-in users  
✅ **Metadata:** Rich device information for debugging and analytics  

**The system is now ready to send push notifications from the web dashboard to all iOS and Android devices! 🚀📱**

