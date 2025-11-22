// Web-specific version of (tabs)/map.tsx - doesn't import Mapbox
import { StyleSheet, View, Alert, Platform, Text } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS } from '@/constants/mapbox';

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [region, setRegion] = useState(DEFAULT_MAP_SETTINGS.initialRegion);

  useEffect(() => {
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

        // Update map region to user's location
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: DEFAULT_MAP_SETTINGS.initialRegion.latitudeDelta,
          longitudeDelta: DEFAULT_MAP_SETTINGS.initialRegion.longitudeDelta,
        });
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

  // Use user's location coordinates (Mapbox format: [longitude, latitude])
  const userCoordinates = initialLocation 
    ? [initialLocation.coords.longitude, initialLocation.coords.latitude] as [number, number]
    : null;

  // Wait for location before showing map
  if (isLoadingLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  // Web fallback - show message that maps are not supported on web
  return (
    <View style={styles.container}>
      <View style={[styles.map, styles.webFallback]}>
        <View style={styles.webFallbackContent}>
          <Text style={styles.webFallbackText}>
            Maps are only available on iOS and Android devices.
          </Text>
          <Text style={styles.webFallbackText}>
            Current Location: {userCoordinates ? `${userCoordinates[1].toFixed(4)}, ${userCoordinates[0].toFixed(4)}` : 'Loading...'}
          </Text>
        </View>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1C39',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  webFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1C39',
  },
  webFallbackContent: {
    padding: 20,
    alignItems: 'center',
  },
  webFallbackText: {
    color: '#ffffff',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
});

