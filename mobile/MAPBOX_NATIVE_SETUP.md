# Mapbox Native Setup Guide

## Error: "native code not available"

This error occurs when Mapbox native modules haven't been properly built. Follow these steps:

## Solution

### 1. Set Mapbox Access Token

Create or update `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiY3JveHN0dWRpb3MiLCJhIjoiY21pOXdneHE0MG1pcjJqcjJlcGFneXphayJ9.CTxVwXB78uY6IDtfEYhlgw
```

### 2. Run Prebuild

Generate native iOS and Android folders:

```bash
cd mobile
npx expo prebuild --clean
```

### 3. Install iOS Dependencies (iOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Build and Run

**For iOS:**
```bash
npx expo run:ios
```

**For Android:**
```bash
npx expo run:android
```

## Important Notes

⚠️ **Mapbox requires a development build** - it won't work in Expo Go!

You must:
1. Run `npx expo prebuild` to generate native code
2. Build the app with `npx expo run:ios` or `npx expo run:android`
3. Cannot use `npx expo start` with Expo Go

## Troubleshooting

### Error persists after prebuild?

1. **Clean build folders:**
   ```bash
   rm -rf ios android
   npx expo prebuild --clean
   ```

2. **Reinstall pods (iOS):**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

3. **Clear Metro cache:**
   ```bash
   npx expo start --clear
   ```

### Check if native modules are loaded

The app will show an error message if Mapbox native modules aren't available. Make sure you see the map, not the error message.

## Verification

After setup, you should see:
- ✅ Map displays on screen
- ✅ User location shown
- ✅ Other users' markers visible
- ❌ No "native code not available" error

