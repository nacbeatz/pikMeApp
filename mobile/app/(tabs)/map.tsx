import { StyleSheet, View, Alert, Platform, Text, Image } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS, MAPBOX_ACCESS_TOKEN } from '@/constants/mapbox';

// Conditionally import Mapbox only on native platforms
let MapView: any;
let Camera: any;
let PointAnnotation: any;
let ShapeSource: any;
let CircleLayer: any;
let point: any;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MapboxModule = require('@rnmapbox/maps');
    
    MapView = MapboxModule.MapView;
    Camera = MapboxModule.Camera;
    PointAnnotation = MapboxModule.PointAnnotation;
    ShapeSource = MapboxModule.ShapeSource;
    CircleLayer = MapboxModule.CircleLayer;
    
    // Set access token - MUST be called before using MapView
    if (MAPBOX_ACCESS_TOKEN) {
      if (MapView && typeof MapView.setAccessToken === 'function') {
        MapView.setAccessToken(MAPBOX_ACCESS_TOKEN);
        console.log('Mapbox access token set successfully');
      } else {
        console.warn('MapView.setAccessToken not available');
      }
    } else {
      console.error('⚠️ Mapbox access token is missing! Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env');
    }
    
    // @ts-ignore - @turf/helpers types issue
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TurfModule = require('@turf/helpers');
    point = TurfModule.point;
  } catch (error) {
    console.error('Failed to load Mapbox native modules:', error);
    console.warn('⚠️ Mapbox requires native code. Run these commands:');
    console.warn('1. npx expo prebuild --clean');
    console.warn('2. cd ios && pod install (for iOS)');
    console.warn('3. npx expo run:ios (NOT expo start with Expo Go)');
  }
}

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [centerCoordinate, setCenterCoordinate] = useState<[number, number]>(
    DEFAULT_MAP_SETTINGS.centerCoordinate
  );

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

        // Update map center to user's location (Mapbox uses [longitude, latitude])
        setCenterCoordinate([
          location.coords.longitude,
          location.coords.latitude,
        ]);
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

  // Use user's current location coordinates
  const userCoordinates = initialLocation 
    ? [initialLocation.coords.longitude, initialLocation.coords.latitude] as [number, number]
    : null;

  // Load users data
  const usersData = require('@/assets/data/users.json');
  const users = usersData as { id: number; name: string; lat: number; long: number; image?: string }[];

  console.log('Total users to display:', users.length);
  console.log('Current user coordinates:', userCoordinates);

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

  // Web fallback
  if (Platform.OS === 'web') {
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

  // Check if Mapbox is available
  if (!MapView || !Camera) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⚠️ Mapbox native modules not available</Text>
          <Text style={[styles.loadingText, { marginTop: 10, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }]}>
            Mapbox requires native code. Follow these steps:
          </Text>
          <Text style={[styles.loadingText, { marginTop: 10, fontSize: 11, textAlign: 'center', paddingHorizontal: 20, color: '#999' }]}>
            1. Run: npx expo prebuild --clean
          </Text>
          <Text style={[styles.loadingText, { marginTop: 5, fontSize: 11, textAlign: 'center', paddingHorizontal: 20, color: '#999' }]}>
            2. For iOS: cd ios && pod install
          </Text>
          <Text style={[styles.loadingText, { marginTop: 5, fontSize: 11, textAlign: 'center', paddingHorizontal: 20, color: '#999' }]}>
            3. Build: npx expo run:ios (NOT Expo Go!)
          </Text>
          <Text style={[styles.loadingText, { marginTop: 10, fontSize: 11, textAlign: 'center', paddingHorizontal: 20, color: '#ff6b6b' }]}>
            ⚠️ Mapbox does NOT work in Expo Go!
          </Text>
        </View>
      </View>
    );
  }

  // Create GeoJSON for user's location circle
  const userLocationPoint = userCoordinates 
    ? point(userCoordinates, { type: 'user' })
    : null;

  // Verify token is set before rendering map
  if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN.trim() === '') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⚠️ Mapbox access token not configured</Text>
          <Text style={[styles.loadingText, { marginTop: 10, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }]}>
            Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env file
          </Text>
          <Text style={[styles.loadingText, { marginTop: 5, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }]}>
            Token should start with: pk.eyJ...
          </Text>
          <Text style={[styles.loadingText, { marginTop: 10, fontSize: 11, textAlign: 'center', paddingHorizontal: 20, color: '#999' }]}>
            Get your token from: https://account.mapbox.com/access-tokens/
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        logoEnabled={false}
        attributionEnabled={false}>
        
        <Camera
          defaultSettings={{
            centerCoordinate: centerCoordinate,
            zoomLevel: 15,
          }}
          centerCoordinate={centerCoordinate}
          zoomLevel={15}
        />

        {/* Display current user's location - shown as a green circle */}
        {userLocationPoint && locationGranted && locationEnabled && (
          <ShapeSource id="userLocation" shape={userLocationPoint}>
            <CircleLayer
              id="userLocationCircle"
              style={{
                circleRadius: 100,
                circleColor: 'rgba(0, 255, 0, 0.3)',
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 3,
              }}
            />
          </ShapeSource>
        )}

        {/* Display current user's location marker */}
        {userCoordinates && (
          <PointAnnotation
            id="currentUser"
            coordinate={userCoordinates}
            title="You are here"
            snippet="Your current location">
            <View style={styles.currentUserMarker} />
          </PointAnnotation>
        )}

        {/* Display all other users' markers with images */}
        {users.map((user) => {
          const userId: string = `user-${user.id}`;
          console.log(`Rendering marker for ${user.name} at ${user.lat}, ${user.long}`);
          return (
            <PointAnnotation
              key={String(user.id)}
              id={userId as any}
              coordinate={[user.long, user.lat]}
              title={user.name}
              snippet={user.image ? `View profile` : `User #${user.id}`}>
              <View style={styles.userImageMarker}>
                {user.image ? (
                  <Image
                    source={{ uri: user.image }}
                    style={styles.userImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.otherUserMarker} />
                )}
              </View>
            </PointAnnotation>
          );
        })}
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
  currentUserMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00FF00',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  otherUserMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5213FE',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  userImageMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#5213FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
});
