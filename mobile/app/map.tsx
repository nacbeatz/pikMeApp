import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import Mapbox, { MapView, Camera, LocationPuck } from '@rnmapbox/maps';
import { DEFAULT_MAP_SETTINGS, MAPBOX_ACCESS_TOKEN as MAPBOX_ACCESS_TOKEN_CONSTANT } from '@/constants/mapbox';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN_CONSTANT);

export default function MapScreen() {
  const colors = Colors.light;

  const handlePickPress = () => {
    // Placeholder for the PICK button
    alert('PICK button pressed');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        <Text style={styles.placeholder}>
          Map Goes Here
        </Text>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.tabBarContainer}>
      <MapView style={styles.mapContainer} styleURL='mapbox://styles/mapbox/dark-v11'>
        <Camera followUserLocation={true} />
        <LocationPuck />
      </MapView>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
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

