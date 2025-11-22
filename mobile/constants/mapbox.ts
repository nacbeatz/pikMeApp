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
  centerCoordinate: [0, 0], // Fallback only - will use user's actual location
};


