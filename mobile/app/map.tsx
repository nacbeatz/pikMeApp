import { StyleSheet, View, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import Mapbox, { 
  MapView, 
  Camera,
  ShapeSource,
  CircleLayer,
} from '@rnmapbox/maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS, MAPBOX_ACCESS_TOKEN } from '@/constants/mapbox';

// Initialize Mapbox access token
if (MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN !== '') {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
} else {
  console.error('⚠️ Mapbox access token not set. Map may not work correctly.');
}

// Check if components are available
console.log('🔵 Mapbox components check:', {
  MapView: !!MapView,
  Camera: !!Camera,
  ShapeSource: !!ShapeSource,
  CircleLayer: !!CircleLayer,
});

export default function MapScreen() {
  const colors = Colors.light;
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);

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
    ? [initialLocation.coords.longitude, initialLocation.coords.latitude]
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

  // Load users data
  const usersData = require('@/assets/data/users.json');
  const users = usersData as { id: number; name: string; lat: number; long: number; image?: string }[];
  
  // Create GeoJSON for user locations
  const userLocations = {
    type: 'FeatureCollection' as const,
    features: users.map((user) => ({
      type: 'Feature' as const,
      id: user.id,
      geometry: {
        type: 'Point' as const,
        coordinates: [user.long, user.lat] as [number, number],
      },
      properties: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })),
  };

  console.log('User locations GeoJSON:', userLocations);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView 
        style={[styles.mapContainer, { width: '100%', height: '100%' }]} 
        styleURL={DEFAULT_MAP_SETTINGS.styleURL}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}>
        <Camera
          defaultSettings={{
            centerCoordinate: userCoordinates,
            zoomLevel: DEFAULT_MAP_SETTINGS.zoomLevel,
          }}
          followUserLocation={locationGranted && locationEnabled}
          followZoomLevel={DEFAULT_MAP_SETTINGS.zoomLevel}
          animationDuration={1000}
        />
        
        {/* User's current location - shown as a green circle */}
        {userCoordinates && ShapeSource && CircleLayer && locationGranted && locationEnabled && (
          <ShapeSource 
            id="current-user-location" 
            shape={{
              type: 'FeatureCollection' as const,
              features: [{
                type: 'Feature' as const,
                id: 'current-user',
                geometry: {
                  type: 'Point' as const,
                  coordinates: userCoordinates as [number, number],
                },
                properties: {
                  id: 'current-user',
                  name: 'You',
                },
              }],
            } as any}>
            <CircleLayer
              id="current-user-circle"
              style={{
                circleRadius: 12,
                circleColor: '#00FF00',
                circleStrokeWidth: 3,
                circleStrokeColor: '#FFFFFF',
                circleOpacity: 0.9,
              }}
            />
          </ShapeSource>
        )}
        
        {/* Display user markers as circles - conditionally render if available */}
        {ShapeSource && CircleLayer && (
          <ShapeSource 
            id="user-locations" 
            shape={userLocations}>
            <CircleLayer
              id="user-circles"
              style={{
                circleRadius: 10,
                circleColor: '#5213FE',
                circleStrokeWidth: 3,
                circleStrokeColor: '#FFFFFF',
                circleOpacity: 0.9,
              }}
            />
          </ShapeSource>
        )}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'red',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#11181C',
  },
  mapContainer: {
    flex: 1,
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
});