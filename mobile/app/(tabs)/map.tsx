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

  // Load dummy users data as fallback
  const dummyUsersData = require('@/assets/data/users.json');
  type DummyUser = {
    id: number;
    name: string;
    lat: number;
    long: number;
    image?: string;
  };
  const dummyUsers = dummyUsersData as DummyUser[];

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
      return;
    }

    // If not authenticated, show dummy data instead
    if (!isAuthenticated) {
      console.log('Not authenticated, showing dummy users data');
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
      console.log('Fetched pick requests:', requests.length);
    } catch (error) {
      console.error('Error fetching pick requests:', error);
      // On error, fall back to dummy data
      console.log('Falling back to dummy users data');
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
      if (userCoordinates && isAuthenticated) {
        console.log('Map screen focused, refreshing nearby pick requests...');
        fetchPickRequests();
      }
    }, [fetchPickRequests, userCoordinates, isAuthenticated])
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

  console.log('Total pick requests to display:', pickRequests.length);
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
        
        {/* Display pick request markers from API */}
        {pickRequests.map((pickRequest) => {
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
              title={pickRequest.userName}
              description={pickRequest.activityType || 'Available'}
              pinColor="#5213FE"
              onPress={() => handleMarkerPress(pickRequest)}
            />
          );
        })}
        
        {/* Display dummy users as fallback markers when API data is not available */}
        {pickRequests.length === 0 && !isLoadingPickRequests && dummyUsers.map((user) => {
          // Convert dummy user to PickRequest-like structure for display
          const dummyPickRequest: PickRequest = {
            pickRequestId: user.id,
            userId: user.id,
            userName: user.name,
            activityType: 'COFFEE',
            durationMinutes: 60,
            latitude: user.lat,
            longitude: user.long,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          };
          
          return (
            <Marker
              key={`dummy-${user.id}`}
              coordinate={{
                latitude: user.lat,
                longitude: user.long,
              }}
              title={user.name}
              description="Available"
              pinColor="#FF6B6B"
              onPress={() => handleMarkerPress(dummyPickRequest)}
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
                <Text style={styles.distanceText}>
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
  distanceText: {
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
});