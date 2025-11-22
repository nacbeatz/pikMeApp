/**
 * Mapbox configuration
 * 
 * To get your Mapbox access token:
 * 1. Create a free account at https://account.mapbox.com/
 * 2. Go to your Account page
 * 3. Copy your Default public token
 * 4. Replace 'YOUR_MAPBOX_ACCESS_TOKEN' below with your token
 * 
 * For production, use environment variables to store the token securely.
 */

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Log token status in development (remove sensitive data in production)
if (__DEV__) {
  if (MAPBOX_ACCESS_TOKEN) {
    console.log('Mapbox access token loaded successfully');
  } else {
    console.warn('⚠️ Mapbox access token not set. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env');
  }
}

// Mapbox style URLs
export const MAPBOX_STYLES = {
  street: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
};

// Default map settings
// Note: centerCoordinate is only used as fallback if user location cannot be determined
export const DEFAULT_MAP_SETTINGS = {
  styleURL: MAPBOX_STYLES.dark,
  zoomLevel: 13,
  centerCoordinate: [50.62999315121865, 4.8636523453947555], // Fallback only - will use user's actual location
};


