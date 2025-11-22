export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Log access token status in development (remove sensitive data in production)
if (__DEV__) {
  if (MAPBOX_ACCESS_TOKEN) {
    console.log('Mapbox access token loaded successfully');
  } else {
    console.warn('⚠️ Mapbox access token not set. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env');
  }
}

// Default map settings
export const DEFAULT_MAP_SETTINGS = {
  zoom: 15,
  centerCoordinate: [4.3517, 50.8503] as [number, number], // [longitude, latitude] for Mapbox
  defaultSettings: {
    zoomLevel: 15,
    centerCoordinate: [4.3517, 50.8503] as [number, number],
  },
};

