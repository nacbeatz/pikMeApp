# Google Maps Setup Guide

## ⚠️ IMPORTANT: API Key Requirements

You need a **Google Maps API Key** for the app to work:

1. **Get your API Key**:
   - Go to https://console.cloud.google.com/
   - Create a new project or select an existing one
   - Enable "Maps SDK for Android" and "Maps SDK for iOS"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key

2. **Set up your API Key**:
   Create a `.env` file in the `mobile/` directory:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```

3. **Restrict your API Key** (Recommended for production):
   - In Google Cloud Console, go to "Credentials"
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps SDK for Android" and "Maps SDK for iOS"
   - Under "Application restrictions", add your app's bundle ID/package name

## Configuration

The API key is configured in `app.json`:
- **iOS**: `ios.config.googleMapsApiKey`
- **Android**: `android.config.googleMaps.apiKey`

Both use the environment variable `${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`.

## Testing

After setting up your API key:
1. Make sure `.env` file exists with your API key
2. Restart your development server: `npm start`
3. Run prebuild: `npx expo prebuild`
4. Build and run your app

## Troubleshooting

### Map not showing
- Check that your API key is correctly set in `.env`
- Verify API key restrictions allow your app
- Check console for error messages

### iOS build errors
- Make sure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env`
- Run `npx expo prebuild --clean` to regenerate native code

### Android build errors
- Verify API key is set correctly
- Check that "Maps SDK for Android" is enabled in Google Cloud Console

