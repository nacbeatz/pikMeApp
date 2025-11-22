import { StyleSheet, View, Alert, Platform, Text } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Conditionally import react-native-maps only on native platforms
let MapView: any;
let Marker: any;
let Circle: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MapsModule = require('react-native-maps');
  MapView = MapsModule.default;
  Marker = MapsModule.Marker;
  Circle = MapsModule.Circle;
  PROVIDER_DEFAULT = MapsModule.PROVIDER_DEFAULT;
}

// Default map settings
const DEFAULT_REGION = {
  latitude: 50.8503,
  longitude: 4.3517,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [region, setRegion] = useState(DEFAULT_REGION);

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
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
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

  // Use user's current location coordinates
  const userCoordinates = initialLocation 
    ? {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      }
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
              Current Location: {userCoordinates ? `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}` : 'Loading...'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
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
        loadingEnabled={true}
        loadingIndicatorColor="#5213FE"
        loadingBackgroundColor="#1F1C39">
        
        {/* Display current user's location - shown as a green circle with marker */}
        {userCoordinates && locationGranted && locationEnabled && (
          <>
            {/* Green circle to highlight your location */}
            <Circle
              center={userCoordinates}
              radius={100}
              strokeWidth={3}
              strokeColor="#FFFFFF"
              fillColor="rgba(0, 255, 0, 0.3)"
            />
            {/* Custom marker for your location */}
            <Marker
              coordinate={userCoordinates}
              title="You are here"
              description="Your current location"
              pinColor="#00FF00"
            />
          </>
        )}
        
        {/* Display all other users' markers with purple pins */}
        {users.map((user) => {
          console.log(`Rendering marker for ${user.name} at ${user.lat}, ${user.long}`);
          return (
            <Marker
              key={user.id}
              coordinate={{
                latitude: user.lat,
                longitude: user.long,
              }}
              title={user.name}
              description={`User #${user.id}`}
              pinColor="#5213FE"
            />
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
});