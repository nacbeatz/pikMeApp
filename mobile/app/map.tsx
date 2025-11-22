import { StyleSheet, View, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS } from '@/constants/maps';

// Platform-specific imports - only load react-native-maps on native platforms
// Metro/Webpack resolver will alias react-native-maps to @teovilla/react-native-web-maps on web
let MapView: any;
let Marker: any;
let Circle: any;
let PROVIDER_GOOGLE: any;

// Load maps module - only called on native platforms in useEffect
// This prevents web bundler from statically analyzing react-native-maps at module load time

export default function MapScreen() {
  const colors = Colors.light;
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState(DEFAULT_MAP_SETTINGS.initialRegion);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load react-native-maps only on native platforms
  // Note: This file should not be loaded on web - Expo uses map.web.tsx for web builds
  // If this runs on web, something is wrong with file resolution
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.error('ERROR: map.tsx is being loaded on web! Should use map.web.tsx instead.');
      setMapsLoaded(true); // Prevent errors
      return;
    }

    if (!mapsLoaded) {
      try {
        // Dynamic require inside useEffect - only executes on native platforms
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const MapsModule = require('react-native-maps');
        MapView = MapsModule.default;
        Marker = MapsModule.Marker;
        Circle = MapsModule.Circle;
        PROVIDER_GOOGLE = MapsModule.PROVIDER_GOOGLE;
        setMapsLoaded(true);
      } catch (error) {
        console.warn('Failed to load react-native-maps:', error);
        setMapsLoaded(true); // Set to true to prevent infinite loading
      }
    }
  }, [mapsLoaded]);

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

  // Web fallback - show message that maps are not fully supported on web
  if (Platform.OS === 'web') {
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

  // Ensure MapView is available before rendering (native platforms only)
  if (!mapsLoaded || !MapView) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.mapContainer, styles.webFallback]}>
          <View style={styles.webFallbackContent}>
            <View style={styles.webFallbackText}>
              Maps not available. Please ensure react-native-maps is properly installed.
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

  // Load users data
  const usersData = require('@/assets/data/users.json');
  const users = usersData as { id: number; name: string; lat: number; long: number; image?: string }[];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView 
        provider={PROVIDER_GOOGLE}
        style={styles.mapContainer}
        initialRegion={region}
        region={region}
        showsUserLocation={locationGranted && locationEnabled}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        mapType="standard"
        customMapStyle={[
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1F1C39' }],
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#000000' }],
          },
        ]}>
        {/* User's current location - shown as a green circle */}
        {userCoordinates && locationGranted && locationEnabled && (
          <Circle
            center={userCoordinates}
            radius={100}
            strokeWidth={3}
            strokeColor="#FFFFFF"
            fillColor="rgba(0, 255, 0, 0.3)"
          />
        )}
        
        {/* Display user markers */}
        {users.map((user) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.lat,
              longitude: user.long,
            }}
            title={user.name}
            pinColor="#5213FE"
          />
        ))}
      </MapView>
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
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pickButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
