import { StyleSheet, View, Alert } from 'react-native';
import Mapbox, { MapView, Camera } from '@rnmapbox/maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN, DEFAULT_MAP_SETTINGS } from '@/constants/mapbox';

// Initialize Mapbox with access token
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    // Set access token on mount
    if (MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN !== 'YOUR_MAPBOX_ACCESS_TOKEN') {
      Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
    } else {
      console.warn('Mapbox access token not set. Please configure it in constants/mapbox.ts or set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN');
    }

    // Request location permissions and get initial location
    (async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Location permission is required to show your location on the map.',
            [{ text: 'OK' }]
          );
          setIsLoadingLocation(false);
          return;
        }

        // Check if location services are enabled
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services in your device settings.',
            [{ text: 'OK' }]
          );
          setIsLoadingLocation(false);
          return;
        }

        setLocationGranted(true);
        setLocationEnabled(enabled);

        // Get initial location - use high accuracy for exact location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          mayShowUserSettingsDialog: true,
        });
        
        console.log('Current location:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        });
        
        setInitialLocation(location);
        setIsLoadingLocation(false);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'Could not get your current location. Please check your device settings.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  // Wait for location before showing map centered on user
  if (isLoadingLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.map} />
      </View>
    );
  }

  // Use user's location if available, otherwise show error
  const userCoordinates = initialLocation 
    ? [initialLocation.coords.longitude, initialLocation.coords.latitude]
    : null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={DEFAULT_MAP_SETTINGS.styleURL}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        userLocationEnabled={locationGranted && locationEnabled}>
        {locationGranted && locationEnabled && userCoordinates ? (
          <Camera 
            defaultSettings={{
              centerCoordinate: userCoordinates,
              zoomLevel: 15,
            }}
            followUserLocation={true}
            followZoomLevel={15}
            animationDuration={1000}
          />
        ) : userCoordinates ? (
          <Camera
            defaultSettings={{
              centerCoordinate: userCoordinates,
              zoomLevel: 15,
            }}
          />
        ) : (
          <Camera
            defaultSettings={{
              centerCoordinate: DEFAULT_MAP_SETTINGS.centerCoordinate,
              zoomLevel: DEFAULT_MAP_SETTINGS.zoomLevel,
            }}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1C39',
  },
  map: {
    flex: 1,
  },
});

