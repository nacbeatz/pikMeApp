// Web-specific version of map.tsx - doesn't import react-native-maps
import { StyleSheet, View, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS } from '@/constants/maps';

export default function MapScreen() {
  const colors = Colors.light;
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
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
      }
    })();
  }, []);

  // Use user's location - wait for it before showing map
  const userCoordinates = initialLocation 
    ? {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      }
    : null;

  console.log('UserCoordinates:', userCoordinates);

  // Wait for user location before showing map
  if (!userCoordinates) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.mapContainer} />
      </View>
    );
  }

  // Web fallback - show message that maps are not supported on web
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapContainer, styles.webFallback]}>
        <View style={styles.webFallbackContent}>
          <View style={styles.webFallbackText}>
            Maps are only available on iOS and Android devices.
          </View>
          <View style={styles.webFallbackText}>
            Current Location: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
          </View>
        </View>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.tabBarContainer}>
        {/* Tab bar content can go here */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  webFallback: {
    justifyContent: 'center',
    alignItems: 'center',
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

