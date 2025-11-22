import { StyleSheet, View, Alert, Platform, Text, Modal, TouchableOpacity, Image } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Conditionally import react-native-maps only on native platforms
let MapView: any;
let Marker: any;
let PROVIDER_DEFAULT: any;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MapsModule = require('react-native-maps');
  MapView = MapsModule.default;
  Marker = MapsModule.Marker;
  PROVIDER_DEFAULT = MapsModule.PROVIDER_DEFAULT;
  // Note: Circle component requires native rebuild - removed for now to avoid errors
  // To use Circle, run: npx expo prebuild --clean && npx expo run:ios
}

// Default map settings
const DEFAULT_REGION = {
  latitude: 50.8503,
  longitude: 4.3517,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

type User = {
  id: number;
  name: string;
  lat: number;
  long: number;
  image?: string;
  activity?: string;
};

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
  const users = usersData as User[];
  
  // Add default activities if not present
  const usersWithActivities = users.map((user) => ({
    ...user,
    activity: user.activity || 'Coffee', // Default activity
  }));
  
  const handleMarkerPress = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };
  
  const handlePick = () => {
    if (selectedUser) {
      Alert.alert('Pick', `You picked ${selectedUser.name}!`, [{ text: 'OK' }]);
      // TODO: Add logic to handle pick action




    }
    setModalVisible(false);
    setSelectedUser(null);
  };
  
  const handleNoPick = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

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
        
        {/* Display current user's location - shown as a green marker */}
        {userCoordinates && locationGranted && locationEnabled && (
          <Marker
            coordinate={userCoordinates}
            title="You are here"
            description="Your current location"
            pinColor="#00FF00"
          />
        )}
        
        {/* Display all other users' markers with purple pins */}
        {usersWithActivities.map((user) => {
          console.log(`Rendering marker for ${user.name} at ${user.lat}, ${user.long}`);
          return (
            <Marker
              key={user.id}
              coordinate={{
                latitude: user.lat,
                longitude: user.long,
              }}
              title={user.name}
              description={user.activity || 'Available'}
              pinColor="#5213FE"
              onPress={() => handleMarkerPress(user)}
            />
          );
        })}
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
            {selectedUser?.image ? (
              <Image
                source={{ uri: selectedUser.image }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {selectedUser?.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            
            {/* User Name */}
            <Text style={styles.userName}>{selectedUser?.name}</Text>
            
            {/* Activity */}
            <View style={styles.activityContainer}>
              <Text style={styles.activityLabel}>Activity:</Text>
              <Text style={styles.activityText}>{selectedUser?.activity || 'Available'}</Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.pickButton]}
                onPress={handlePick}
                activeOpacity={0.8}>
                <Text style={styles.pickButtonText}>Pick</Text>
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