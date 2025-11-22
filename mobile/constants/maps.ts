export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Log API key status in development (remove sensitive data in production)
if (__DEV__) {
  if (GOOGLE_MAPS_API_KEY) {
    console.log('Google Maps API key loaded successfully');
  } else {
    console.warn('⚠️ Google Maps API key not set. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env');
  }
}

// Default map settings
// Note: initialRegion is only used as fallback if user location cannot be determined
export const DEFAULT_MAP_SETTINGS = {
  zoom: 15,
  initialRegion: {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};

