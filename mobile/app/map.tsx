import { StyleSheet, View, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import Mapbox, { MapView, Camera, LocationPuck } from '@rnmapbox/maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS, MAPBOX_ACCESS_TOKEN as MAPBOX_ACCESS_TOKEN_CONSTANT } from '@/constants/mapbox';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN_CONSTANT);

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

  // Use user's location if available
  const userCoordinates = initialLocation 
    ? [initialLocation.coords.longitude, initialLocation.coords.latitude]
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView 
        style={styles.mapContainer} 
        styleURL={DEFAULT_MAP_SETTINGS.styleURL}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}>
        {locationGranted && locationEnabled && userCoordinates ? (
          <>
            <Camera 
              defaultSettings={{
                centerCoordinate: userCoordinates,
                zoomLevel: DEFAULT_MAP_SETTINGS.zoomLevel,
              }}
              followUserLocation={true}
              followZoomLevel={DEFAULT_MAP_SETTINGS.zoomLevel}
              animationDuration={1000}
            />
            <LocationPuck 
              puckBearingEnabled={true}
              puckBearing="heading"
            />
          </>
        ) : (
          <Camera
            defaultSettings={{
              centerCoordinate: userCoordinates || DEFAULT_MAP_SETTINGS.centerCoordinate,
              zoomLevel: DEFAULT_MAP_SETTINGS.zoomLevel,
            }}
          />
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

