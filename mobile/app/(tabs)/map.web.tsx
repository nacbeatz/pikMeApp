// Web-specific version of (tabs)/map.tsx - uses @teovilla/react-native-web-maps via Metro alias
import { StyleSheet, View, Alert, Text, Modal, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/constants/maps';
import { getNearbyPickRequests, sendPickRequest, type PickRequest } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Import react-native-maps - Metro will alias to @teovilla/react-native-web-maps on web
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MapsModule = require('react-native-maps');
const MapView = MapsModule.default;
const Marker = MapsModule.Marker;
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
  const userCoordinates = useMemo(() => {
    return initialLocation
      ? {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        }
      : null;
  }, [initialLocation]);

  // Function to fetch nearby pick requests (extracted for reuse)
  const fetchPickRequests = useCallback(async () => {
    if (!userCoordinates) {
      console.log('No user coordinates available yet, skipping fetch');
      return;
    }

    // If not authenticated, don't show anything
    if (!isAuthenticated) {
      console.log('Not authenticated, cannot fetch pick requests');
      setPickRequests([]);
      setIsLoadingPickRequests(false);
      return;
    }

    setIsLoadingPickRequests(true);
    try {
      const requests = await getNearbyPickRequests(
        userCoordinates.latitude,
        userCoordinates.longitude,
        5000 // 5km radius
      );
      setPickRequests(requests);
      console.log('Fetched pick requests from database:', requests.length);
    } catch (error) {
      console.error('Error fetching pick requests:', error);
      // On error, clear requests and show empty state
      setPickRequests([]);
    } finally {
      setIsLoadingPickRequests(false);
    }
  }, [isAuthenticated, userCoordinates]);

  // Fetch nearby pick requests when component mounts or when dependencies change
  useEffect(() => {
    fetchPickRequests();
  }, [fetchPickRequests]);

  // Refresh nearby pick requests when screen is focused (e.g., after creating a pick request)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have coordinates and are authenticated, and location is loaded
      if (userCoordinates && isAuthenticated && !isLoadingLocation) {
        console.log('Map screen focused, refreshing nearby pick requests...');
        // Small delay to avoid race conditions when navigating from other screens
        const timer = setTimeout(() => {
          fetchPickRequests();
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }, [fetchPickRequests, userCoordinates, isAuthenticated, isLoadingLocation])
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
      // Refetch pick requests to update the map after a successful pick
      fetchPickRequests();
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

  console.log('Total pick requests to display:', pickRequests.length);
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
        {userCoordinates && locationGranted && locationEnabled && (
          <Marker
            coordinate={userCoordinates}
            title="You are here"
            description="Your current location"
            pinColor="#00FF00"
          />
        )}
        
        {/* Display pick request markers from API - only active requests from database */}
        {pickRequests
          .filter((pickRequest) => 
            pickRequest.status === 'ACTIVE' && 
            pickRequest.latitude != null && 
            pickRequest.longitude != null
          )
          .map((pickRequest) => {
            console.log(
              `Rendering marker for ${pickRequest.userName} at ${pickRequest.latitude}, ${pickRequest.longitude}`
            );
            return (
              <Marker
                key={`pick-${pickRequest.pickRequestId}`}
                coordinate={{
                  latitude: pickRequest.latitude,
                  longitude: pickRequest.longitude,
                }}
                title={pickRequest.userName || 'Unknown User'}
                description={pickRequest.activityType || 'Available'}
                pinColor="#5213FE"
                onPress={() => handleMarkerPress(pickRequest)}
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
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {selectedPickRequest?.userName?.charAt(0) || '?'}
              </Text>
            </View>

            {/* User Name */}
            <Text style={styles.userName}>{selectedPickRequest?.userName}</Text>

            {/* Activity */}
            <View style={styles.activityContainer}>
              <Text style={styles.activityLabel}>Activity:</Text>
              <Text style={styles.activityText}>{selectedPickRequest?.activityType || 'Available'}</Text>
            </View>

            {/* Subject */}
            {selectedPickRequest?.subject && (
              <View style={styles.subjectContainer}>
                <Text style={styles.subjectLabel}>Subject:</Text>
                <Text style={styles.subjectText}>{selectedPickRequest.subject}</Text>
              </View>
            )}

            {/* Duration */}
            {selectedPickRequest?.durationMinutes && (
              <View style={styles.durationContainer}>
                <Text style={styles.durationLabel}>Duration:</Text>
                <Text style={styles.durationText}>{selectedPickRequest.durationMinutes} minutes</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.pickButton]}
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
                activeOpacity={0.8}>
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
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 28, 57, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    marginBottom: 8,
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
    marginBottom: 8,
    alignItems: 'center',
  },
  subjectLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  durationContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 16,
    color: '#FFFFFF',
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
});
