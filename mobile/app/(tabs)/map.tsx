import { StyleSheet, View, Alert, Text, Modal, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/constants/maps';
import { getNearbyPickRequests, sendPickRequest, type PickRequest } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Import react-native-maps - Metro will alias to @teovilla/react-native-web-maps on web
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MapsModule = require('react-native-maps');
const MapView = MapsModule.default;
const Marker = MapsModule.Marker;
const Polyline = MapsModule.Polyline;
const PROVIDER_DEFAULT = MapsModule.PROVIDER_DEFAULT;

// Default map settings
const DEFAULT_REGION = {
  latitude: 50.8503,
  longitude: 4.3517,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{
    trackMatch?: string;
    requesterLat?: string;
    requesterLng?: string;
    pickerName?: string;
    requesterName?: string;
    pickerId?: string;
    requesterId?: string;
  }>();
  
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [selectedPickRequest, setSelectedPickRequest] = useState<PickRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickRequests, setPickRequests] = useState<PickRequest[]>([]);
  const [isLoadingPickRequests, setIsLoadingPickRequests] = useState(false);
  const [isSendingPick, setIsSendingPick] = useState(false);
  
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [trackingMatch, setTrackingMatch] = useState<{
    matchId: number;
    requesterLat: number;
    requesterLng: number;
    pickerName: string;
    requesterName: string;
    pickerId: number;
    requesterId: number;
  } | null>(null);
  
  // Live location tracking
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

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

  // Use user's current location coordinates (memoized to avoid useEffect dependency issues)
  // When tracking, use live location; otherwise use initial location
  const userCoordinates = useMemo(() => {
    if (isTracking && currentLocation) {
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
    }
    return initialLocation
      ? {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        }
      : null;
  }, [initialLocation, currentLocation, isTracking]);

  // Ref to track if a fetch is in progress to prevent duplicate calls
  const isFetchingRef = useRef(false);

  // Check if we should start tracking from params
  useEffect(() => {
    if (params.trackMatch && params.requesterLat && params.requesterLng) {
      setIsTracking(true);
      setTrackingMatch({
        matchId: parseInt(params.trackMatch, 10),
        requesterLat: parseFloat(params.requesterLat),
        requesterLng: parseFloat(params.requesterLng),
        pickerName: params.pickerName || 'Picker',
        requesterName: params.requesterName || 'Requester',
        pickerId: params.pickerId ? parseInt(params.pickerId, 10) : 0,
        requesterId: params.requesterId ? parseInt(params.requesterId, 10) : 0,
      });
    }
  }, [params.trackMatch, params.requesterLat, params.requesterLng, params.pickerName, params.requesterName, params.pickerId, params.requesterId]);

  // Start live location tracking when in tracking mode
  useEffect(() => {
    if (isTracking && locationGranted && locationEnabled) {
      // Start watching location updates
      const startWatching = async () => {
        try {
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Highest,
              timeInterval: 2000, // Update every 2 seconds
              distanceInterval: 5, // Update every 5 meters
            },
            (location) => {
              setCurrentLocation(location);
              // Update map region to show both locations
              if (trackingMatch) {
                const centerLat = (location.coords.latitude + trackingMatch.requesterLat) / 2;
                const centerLng = (location.coords.longitude + trackingMatch.requesterLng) / 2;
                
                // Calculate delta to fit both points
                const latDelta = Math.abs(location.coords.latitude - trackingMatch.requesterLat) * 1.5;
                const lngDelta = Math.abs(location.coords.longitude - trackingMatch.requesterLng) * 1.5;
                
                setRegion({
                  latitude: centerLat,
                  longitude: centerLng,
                  latitudeDelta: Math.max(latDelta, 0.01),
                  longitudeDelta: Math.max(lngDelta, 0.01),
                });
              }
            }
          );
          locationSubscriptionRef.current = subscription;
        } catch (error) {
          console.error('Error starting location watch:', error);
        }
      };
      
      startWatching();
    }
    
    // Cleanup: stop watching when tracking stops
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [isTracking, locationGranted, locationEnabled, trackingMatch]);

  // Function to fetch nearby pick requests (extracted for reuse)
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
          5000 // 5km radius
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

  // Refresh nearby pick requests when screen is focused (e.g., after creating a pick request)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have coordinates and location is loaded (authentication not required)
      if (userCoordinates && !isLoadingLocation) {
        console.log('Map screen focused, refreshing nearby pick requests...');
        // Small delay to avoid race conditions when navigating from other screens
        const timer = setTimeout(() => {
          fetchPickRequests();
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }, [fetchPickRequests, userCoordinates, isLoadingLocation])
  );
  
  const handleMarkerPress = (pickRequest: PickRequest) => {
    setSelectedPickRequest(pickRequest);
    setModalVisible(true);
  };
  
  const handlePick = async () => {
    if (!selectedPickRequest) return;

    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to send a pick request.', [
        { text: 'OK' },
      ]);
      setModalVisible(false);
      return;
    }

    setIsSendingPick(true);
    try {
      await sendPickRequest(selectedPickRequest.pickRequestId);
      Alert.alert(
        'Pick Request Sent!',
        `You sent a pick request to ${selectedPickRequest.userName}. They will be notified.`,
        [{ text: 'OK' }]
      );
      // Remove the picked request from the list since it's now MATCHED
      setPickRequests((prev) =>
        prev.filter((req) => req.pickRequestId !== selectedPickRequest.pickRequestId)
      );
    } catch (error: any) {
      console.error('Error sending pick request:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send pick request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSendingPick(false);
      setModalVisible(false);
      setSelectedPickRequest(null);
    }
  };
  
  const handleNoPick = () => {
    setModalVisible(false);
    setSelectedPickRequest(null);
  };

  // Helper function to validate coordinates
  const isValidCoordinate = useCallback((lat: number | null | undefined, lng: number | null | undefined): boolean => {
    if (lat == null || lng == null) return false;
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }, []);

  // Filter valid pick requests - show all requests with valid coordinates, regardless of status
  const validPickRequests = useMemo(() => {
    const filtered = pickRequests.filter((pickRequest) => {
      const hasValidCoords = isValidCoordinate(pickRequest.latitude, pickRequest.longitude);
      if (!hasValidCoords) {
        console.log('Invalid coordinates for request:', pickRequest.pickRequestId, {
          lat: pickRequest.latitude,
          lng: pickRequest.longitude,
          status: pickRequest.status
        });
      }
      return hasValidCoords;
    });
    return filtered;
  }, [pickRequests, isValidCoordinate]);

  console.log('Total pick requests from API:', pickRequests.length);
  console.log('Valid pick requests (with valid coordinates):', validPickRequests.length);
  console.log('Pick requests details:', pickRequests.map(pr => ({
    id: pr.pickRequestId,
    status: pr.status,
    lat: pr.latitude,
    lng: pr.longitude,
    name: pr.userName
  })));
  console.log('Current user coordinates:', userCoordinates);

  // Wait for location before showing map
  if (isLoadingLocation || !userCoordinates) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
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
        loadingBackgroundColor="#1F1C39"
        {...(Platform.OS === 'web' && GOOGLE_MAPS_API_KEY ? { googleMapsApiKey: GOOGLE_MAPS_API_KEY } : {})}>
        
        {/* Display current user's location - shown as a green marker */}
        {userCoordinates && 
         locationGranted && 
         locationEnabled &&
         isValidCoordinate(userCoordinates.latitude, userCoordinates.longitude) && (
          <Marker
            coordinate={{
              latitude: Number(userCoordinates.latitude),
              longitude: Number(userCoordinates.longitude),
            }}
            title="You are here"
            description="Your current location"
            {...(Platform.OS === 'android' && { pinColor: '#00FF00' })}
          />
        )}

        {/* Tracking mode: Show itinerary between picker and requester */}
        {isTracking && trackingMatch && userCoordinates && 
         isValidCoordinate(userCoordinates.latitude, userCoordinates.longitude) &&
         isValidCoordinate(trackingMatch.requesterLat, trackingMatch.requesterLng) && (
          <>
            {/* Polyline showing route between picker (current user) and requester */}
            <Polyline
              coordinates={[
                {
                  latitude: Number(userCoordinates.latitude),
                  longitude: Number(userCoordinates.longitude),
                },
                {
                  latitude: trackingMatch.requesterLat,
                  longitude: trackingMatch.requesterLng,
                },
              ]}
              strokeColor="#5213FE"
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
            
            {/* Requester location marker */}
            <Marker
              coordinate={{
                latitude: trackingMatch.requesterLat,
                longitude: trackingMatch.requesterLng,
              }}
              title={trackingMatch.requesterName}
              description="Meeting location"
              {...(Platform.OS === 'android' && { pinColor: '#FF6B6B' })}
            />
          </>
        )}
        
        {/* Display pick request markers from API - only active requests from database */}
        {validPickRequests.map((pickRequest) => {
          const lat = Number(pickRequest.latitude);
          const lng = Number(pickRequest.longitude);
          
          if (!isValidCoordinate(lat, lng)) {
            console.warn('Invalid coordinates for pick request:', pickRequest.pickRequestId);
            return null;
          }

          return (
            <Marker
              key={`pick-${pickRequest.pickRequestId}`}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              title={String(pickRequest.userName || 'Unknown User')}
              description={String(pickRequest.activityType || 'Available')}
              {...(Platform.OS === 'android' && { pinColor: '#5213FE' })}
              onPress={() => {
                try {
                  handleMarkerPress(pickRequest);
                } catch (error) {
                  console.error('Error handling marker press:', error);
                }
              }}
            />
          );
        })}
        
        {/* Show loading indicator when fetching pick requests */}
        {isLoadingPickRequests && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#5213FE" />
            <Text style={styles.loadingText}>Loading nearby requests...</Text>
          </View>
        )}
      </MapView>

      {/* Tracking mode indicator with live status */}
      {isTracking && trackingMatch && (
        <View style={styles.trackingBanner}>
          <View style={styles.trackingContent}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
            </View>
            <MaterialIcons name="navigation" size={20} color="#FFFFFF" />
            <View style={styles.trackingTextContainer}>
              <Text style={styles.trackingTitle}>Live Tracking Active</Text>
              <Text style={styles.trackingSubtitle}>
                Meeting {trackingMatch.requesterName}
                {userCoordinates && trackingMatch && (
                  <Text style={styles.distanceText}>
                    {' • '}
                    {calculateDistance(
                      userCoordinates.latitude,
                      userCoordinates.longitude,
                      trackingMatch.requesterLat,
                      trackingMatch.requesterLng
                    ).toFixed(1)} km away
                  </Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsTracking(false);
                setTrackingMatch(null);
                if (locationSubscriptionRef.current) {
                  locationSubscriptionRef.current.remove();
                  locationSubscriptionRef.current = null;
                }
              }}
              style={styles.stopTrackingButton}>
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* User Details Modal/Lightbox */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleNoPick}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleNoPick}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            {/* User Avatar */}
            {selectedPickRequest?.userId ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {selectedPickRequest.userName?.charAt(0) || '?'}
                </Text>
              </View>
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>?</Text>
              </View>
            )}
            
            {/* User Name */}
            <Text style={styles.userName}>{selectedPickRequest?.userName || 'Unknown'}</Text>
            
            {/* Activity */}
            <View style={styles.activityContainer}>
              <Text style={styles.activityLabel}>Activity:</Text>
              <Text style={styles.activityText}>
                {selectedPickRequest?.activityType || 'Available'}
              </Text>
            </View>
            
            {/* Subject if available */}
            {selectedPickRequest?.subject && (
              <View style={styles.subjectContainer}>
                <Text style={styles.subjectText}>{selectedPickRequest.subject}</Text>
              </View>
            )}
            
            {/* Distance if available */}
            {selectedPickRequest?.distanceMeters && (
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceTextModal}>
                  {(selectedPickRequest.distanceMeters / 1000).toFixed(1)} km away
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.pickButton, isSendingPick && styles.buttonDisabled]}
                onPress={handlePick}
                disabled={isSendingPick}
                activeOpacity={0.8}>
                {isSendingPick ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.pickButtonText}>Pick</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.noPickButton]}
                onPress={handleNoPick}
                activeOpacity={0.8}
                disabled={isSendingPick}>
                <Text style={styles.noPickButtonText}>No Pick</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2A2540',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '300',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#5213FE',
  },
  avatarPlaceholder: {
    backgroundColor: '#5213FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  activityContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  activityText: {
    fontSize: 18,
    color: '#5213FE',
    fontWeight: '600',
  },
  subjectContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subjectText: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  distanceContainer: {
    marginBottom: 12,
  },
  distanceTextModal: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButton: {
    backgroundColor: '#5213FE',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noPickButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  noPickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#5213FE',
    borderRadius: 12,
    padding: 16,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  trackingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackingTextContainer: {
    flex: 1,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackingSubtitle: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  stopTrackingButton: {
    padding: 4,
  },
  liveIndicator: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  liveTrackingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveTrackingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF00',
  },
  distanceText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: '600',
  },
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}