import { StyleSheet, View, Platform, Alert, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { DEFAULT_MAP_SETTINGS, GOOGLE_MAPS_API_KEY } from '@/constants/maps';
import { getNearbyPickRequests, type PickRequest } from '@/services/api';

// Import react-native-maps - Metro will alias to @teovilla/react-native-web-maps on web
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MapsModule = require('react-native-maps');
const MapView = MapsModule.default;
const Marker = MapsModule.Marker;
const Circle = MapsModule.Circle;
const PROVIDER_GOOGLE = MapsModule.PROVIDER_GOOGLE;

export default function MapScreen() {
  const colors = Colors.light;
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState(DEFAULT_MAP_SETTINGS.initialRegion);
  const [pickRequests, setPickRequests] = useState<PickRequest[]>([]);
  const [isLoadingPickRequests, setIsLoadingPickRequests] = useState(false);
  const isFetchingRef = useRef(false);

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

  // Use user's location - wait for it before showing map (memoized to avoid dependency issues)
  const userCoordinates = useMemo(() => {
    return initialLocation 
      ? {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        }
      : null;
  }, [initialLocation]);

  // Function to fetch nearby pick requests from database
  // Note: Authentication is NOT required to view pick requests, only to pick someone
  const fetchPickRequests = useCallback(async () => {
    if (!userCoordinates) {
      console.log('No user coordinates available yet, skipping fetch');
      setIsLoadingPickRequests(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log('Already fetching pick requests, skipping duplicate call');
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingPickRequests(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });

      const requests = await Promise.race([
        getNearbyPickRequests(
          userCoordinates.latitude,
          userCoordinates.longitude,
          50000 // 50km radius
        ),
        timeoutPromise,
      ]);

      setPickRequests(requests);
      console.log('Fetched pick requests from database:', requests.length);
    } catch (error: any) {
      console.error('Error fetching pick requests:', error);
      // On error, clear requests and show empty state
      setPickRequests([]);
      // Show error message to user
      if (error?.message === 'Request timeout') {
        Alert.alert(
          'Timeout',
          'Request took too long. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoadingPickRequests(false);
      isFetchingRef.current = false;
    }
  }, [userCoordinates]);

  // Fetch nearby pick requests when component mounts or when dependencies change
  useEffect(() => {
    fetchPickRequests();
  }, [fetchPickRequests]);

  // Refresh nearby pick requests when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have coordinates (authentication not required)
      if (userCoordinates) {
        console.log('Map screen focused, refreshing nearby pick requests...');
        const timer = setTimeout(() => {
          fetchPickRequests();
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }, [fetchPickRequests, userCoordinates])
  );

  console.log('UserCoordinates:', userCoordinates);
  console.log('Total pick requests to display:', pickRequests.length);

  // Wait for user location before showing map
  if (!userCoordinates) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.mapContainer} />
      </View>
    );
  }

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
        {...(Platform.OS === 'web' && GOOGLE_MAPS_API_KEY ? { googleMapsApiKey: GOOGLE_MAPS_API_KEY } : {})}
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
        
        {/* Display pick request markers from API - only active requests from database */}
        {pickRequests
          .filter((pickRequest) => 
            pickRequest.status === 'ACTIVE' && 
            pickRequest.latitude != null && 
            pickRequest.longitude != null &&
            typeof pickRequest.latitude === 'number' &&
            typeof pickRequest.longitude === 'number' &&
            !isNaN(pickRequest.latitude) &&
            !isNaN(pickRequest.longitude) &&
            pickRequest.latitude >= -90 &&
            pickRequest.latitude <= 90 &&
            pickRequest.longitude >= -180 &&
            pickRequest.longitude <= 180
          )
          .map((pickRequest) => (
            <Marker
              key={`pick-${pickRequest.pickRequestId}`}
              coordinate={{
                latitude: Number(pickRequest.latitude),
                longitude: Number(pickRequest.longitude),
              }}
              title={String(pickRequest.userName || 'Unknown User')}
              description={String(pickRequest.activityType || 'Available')}
              {...(Platform.OS === 'android' && { pinColor: '#5213FE' })}
            />
          ))}
        
        {/* Show loading indicator when fetching pick requests */}
        {isLoadingPickRequests && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#5213FE" />
            <Text style={styles.loadingText}>Loading nearby requests...</Text>
          </View>
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
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(31, 28, 57, 0.8)',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
});
