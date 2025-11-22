# Mapbox Configuration Guide

## ⚠️ IMPORTANT: Token Requirements

You need **TWO different tokens** from Mapbox:

1. **Public Access Token** (`pk.eyJ...`) - Used in the app for map rendering
2. **Secret Access Token** (`sk.eyJ...`) - Used for downloading SDKs during build ⚠️ **REQUIRED for iOS/Android builds**

## Setup Instructions

### 1. Get Your Tokens

1. Go to https://account.mapbox.com/
2. Login or create a free account
3. Navigate to [Access Tokens page](https://account.mapbox.com/access-tokens/)
4. Copy:
   - **Default public token** (starts with `pk.eyJ...`)
   - **Secret token** (starts with `sk.eyJ...`) - This is separate from the public token!

### 2. Create Environment Variables File

Create a `.env` file in the `mobile` directory:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and replace the placeholder values:

```env
# Public Access Token (pk.eyJ...) - Used in the app for map rendering
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiY3JveHN0dWRpb3MiLCJhIjoiY21pOXdneHE0MG1pcjJqcjJlcGFneXphayJ9.CTxVwXB78uY6IDtfEYhlgw

# Secret Access Token (sk.eyJ...) - Used for downloading SDKs during build
# ⚠️ IMPORTANT: This MUST be your SECRET token (starts with sk.eyJ), NOT the public token!
# Without this, CocoaPods will fail to download Mapbox SDKs
RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.eyJ1IjoiY3JveHN0dWRpb3MiLCJhIjoiY21pOXdneHE0MG1pcjJqcjJlcGFneXphayJ9.YOUR_SECRET_TOKEN_HERE
```

### 3. Verify Configuration

- ✅ `.env` file exists in `mobile/` directory
- ✅ `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` is set to your public token (`pk.eyJ...`)
- ✅ `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` is set to your **secret token** (`sk.eyJ...`)
- ✅ `.env` is in `.gitignore` (never commit secrets!)

### 4. Build Native Code

After setting up your `.env` file, rebuild your app:

```bash
# Clean previous builds (optional but recommended)
rm -rf ios android

# For iOS
npx expo prebuild
npx expo run:ios

# For Android
npx expo prebuild
npx expo run:android
```

## Common Issues

### ❌ Error: "Error installing MapboxCommon"

**Cause**: You're using the public token (`pk.eyJ...`) instead of the secret token (`sk.eyJ...`) for downloads.

**Solution**: 
1. Check your `.env` file
2. Make sure `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` is set to your **secret token** (`sk.eyJ...`)
3. Delete `ios/` and `android/` folders
4. Run `npx expo prebuild` again

### ❌ Warning: "RNMapboxMapsDownloadToken is deprecated"

**Cause**: You're using the old plugin config in `app.json`.

**Solution**: The plugin config has been removed. Use the `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` environment variable instead.

### ❌ Map doesn't load

**Cause**: Public access token is missing or invalid.

**Solution**: 
1. Check `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env`
2. Verify the token in `mobile/constants/mapbox.ts`

## Configuration Files

- **`.env`** - Environment variables (contains secrets - DO NOT COMMIT)
- **`.env.example`** - Example file (safe to commit)
- **`mobile/constants/mapbox.ts`** - Mapbox configuration
- **`mobile/app.json`** - App configuration (already configured)

## Resources

- [Mapbox Account](https://account.mapbox.com/)
- [Access Tokens](https://account.mapbox.com/access-tokens/)
- [@rnmapbox/maps Documentation](https://github.com/rnmapbox/maps)
- [Expo Documentation](https://docs.expo.dev/)
