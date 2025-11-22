import { StyleSheet, View, Alert } from 'react-native';
import Mapbox, { MapView, Camera, LocationPuck } from '@rnmapbox/maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN, DEFAULT_MAP_SETTINGS } from '@/constants/mapbox';

// Initialize Mapbox with access token
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    // Set access token on mount
    if (MAPBOX_ACCESS_TOKEN && MAPBOX_ACCESS_TOKEN !== 'YOUR_MAPBOX_ACCESS_TOKEN') {
      Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
    } else {
      console.warn('Mapbox access token not set. Please configure it in constants/mapbox.ts or set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN');
    }

    // Request location permissions
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your location on the map.',
          [{ text: 'OK' }]
        );
        return;
      }
      setLocationGranted(true);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={DEFAULT_MAP_SETTINGS.styleURL}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}>
        {locationGranted ? (
          <>
            <Camera followUserLocation={true} followUserLocationPriority="high" />
            <LocationPuck />
          </>
        ) : (
          <Camera
            defaultSettings={{
              centerCoordinate: DEFAULT_MAP_SETTINGS.centerCoordinate,
              zoomLevel: DEFAULT_MAP_SETTINGS.zoomLevel,
            }}
          />
        )}
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
});

