# Fix: Mapbox Native Modules Not Available

## Error
```
Failed to load Mapbox native modules: Error: @rnmapbox/maps native not available
```

## Solution

Mapbox requires **native code** and does **NOT work in Expo Go**. You must build a development build.

### Step 1: Generate Native Code

```bash
cd mobile
npx expo prebuild --clean
```

This creates `ios/` and `android/` folders with native code.

### Step 2: Install iOS Dependencies (iOS only)

```bash
cd ios
pod install
cd ..
```

### Step 3: Build and Run (NOT Expo Go!)

**For iOS:**
```bash
npx expo run:ios
```

**For Android:**
```bash
npx expo run:android
```

### ⚠️ Important Notes

1. **Cannot use Expo Go**: Mapbox requires custom native modules that Expo Go doesn't support
2. **Must use development build**: Use `npx expo run:ios` or `npx expo run:android`
3. **First build takes time**: The first build downloads Mapbox SDKs and can take 5-10 minutes

### Verify Setup

After running the commands above, you should see:
- ✅ `ios/` and `android/` folders exist
- ✅ App builds successfully
- ✅ Map displays on screen (not error message)

### Troubleshooting

**If prebuild fails:**
- Make sure you have Xcode installed (for iOS)
- Make sure you have Android Studio installed (for Android)
- Check that `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env`

**If pods fail to install:**
- Make sure you have CocoaPods: `sudo gem install cocoapods`
- Try: `cd ios && rm -rf Pods Podfile.lock && pod install`

**If build fails:**
- Clean build: `rm -rf ios android`
- Run prebuild again: `npx expo prebuild --clean`
- Rebuild: `npx expo run:ios`

