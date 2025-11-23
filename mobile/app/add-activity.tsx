<<<<<<< HEAD
import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
=======
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
>>>>>>> 16c2ec966b9cd38252e4b3a520c5fdce037a80c6
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { createPickRequest } from '@/services/api';

const timeLogo = require('@/assets/images/clock.png')
const activityLogo = require('@/assets/images/activityLogo.png')

const ACTIVITIES = [
  'COFFEE', 
  'WALK', 
  'FOOD', 
  'GAMING' ,
  'STUDY' ,
  'MOVIE' ,
  'GYM' ,
  'OTHER',
];

const TIME_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '5 hours', value: 300 },
  { label: '6 hours', value: 360 },
  { label: 'All day', value: 1440 },
];

type Step = 'activity' | 'time' | 'submitting' | 'success' | 'failed';

// Map activity names to backend ActivityType enum values
// Backend supports: COFFEE, WALK, FOOD, GAMING, STUDY, MOVIE, GYM, OTHER
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'Coffee': 'COFFEE',
  'Lunch': 'FOOD',
  'Dinner': 'FOOD',
  'Drinks': 'FOOD',
  'Walk': 'WALK',
  'Study': 'STUDY',
  'Work': 'OTHER', // WORK not in backend enum, use OTHER
  'Shopping': 'OTHER', // SHOPPING not in backend enum, use OTHER
  'Gym': 'GYM',
  'Other': 'OTHER',
};

export default function AddActivityScreen() {
  const [step, setStep] = useState<Step>('activity');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [customActivity, setCustomActivity] = useState('');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'We need your location to create a pick request.',
            [{ text: 'OK' }]
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'Could not get your location. Please enable location services.',
          [{ text: 'OK' }]
        );
      }
    };

    getLocation();
  }, []);

  const handleActivityNext = () => {
    if (!selectedActivity && !customActivity.trim()) {
      return;
    }
    setStep('time');
  };

  const handleTimeNext = () => {
    if (!selectedTime && !customTime.trim()) {
      return;
    }
    setStep('submitting');
    submitActivity();
  };

  const submitActivity = async () => {
    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        Alert.alert(
          'Authentication Required',
          'Please login to create a pick request.',
          [{ text: 'OK' }]
        );
        setStep('failed');
        return;
      }

      // Check location
      if (!userLocation) {
        Alert.alert(
          'Location Required',
          'We need your location to create a pick request. Please enable location services.',
          [{ text: 'OK' }]
        );
        setStep('failed');
        return;
      }

      const activity = customActivity.trim() || selectedActivity;
      const timeMinutes = selectedTime || parseInt(customTime.trim(), 10);

      if (!timeMinutes || timeMinutes <= 0) {
        setStep('failed');
        return;
      }

      if (!activity) {
        setStep('failed');
        return;
      }

      // Map activity to backend enum format
      const activityType = ACTIVITY_TYPE_MAP[activity] || 'OTHER';
      const subject = activity; // Use activity name as subject

      // Call the API
      await createPickRequest({
        activityType,
        subject,
        durationMinutes: timeMinutes,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      console.log('Pick request created:', { activity, timeMinutes, activityType });
      setStep('success');
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create pick request. Please try again.',
        [{ text: 'OK' }]
      );
      setStep('failed');
    }
  };

  const handleViewMap = () => {
    router.replace('/(tabs)/map');
  };

  const handleQuit = () => {
    router.replace('/(tabs)/home');
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('activity');
    }
  };

  // Step 1: Activity Selection
  if (step === 'activity') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Image 
            source={activityLogo}
            style={styles.activityImage}/>
          <Text style={styles.title}>Step 1 of 2</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>

          <View style={styles.activityGrid}>
            {ACTIVITIES.map((activity) => (
              <TouchableOpacity
                key={activity}
                style={[
                  styles.activityButton,
                  selectedActivity === activity && styles.activityButtonSelected,
                ]}
                onPress={() => {
                  setSelectedActivity(activity);
                  setCustomActivity('');
                }}>
                <Text
                  style={[
                    styles.activityButtonText,
                    selectedActivity === activity && styles.activityButtonTextSelected,
                  ]}>
                  {activity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.orText}>OR</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter custom activity"
            placeholderTextColor="#A0A0A0"
            value={customActivity}
            onChangeText={(text) => {
              setCustomActivity(text);
              setSelectedActivity('');
            }}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!selectedActivity && !customActivity.trim()) && styles.nextButtonDisabled,
            ]}
            onPress={handleActivityNext}
            disabled={!selectedActivity && !customActivity.trim()}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 2: Time Selection
  if (step === 'time') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Image 
            source={timeLogo}
            style={styles.images}/>
          <Text style={styles.title}>Step 2 of 2</Text>
          <Text style={styles.subtitle}>How long? (Today)</Text>

          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeButton,
                  selectedTime === option.value && styles.timeButtonSelected,
                ]}
                onPress={() => {
                  setSelectedTime(option.value);
                  setCustomTime('');
                }}>
                <Text
                  style={[
                    styles.timeButtonText,
                    selectedTime === option.value && styles.timeButtonTextSelected,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.orText}>OR</Text>

          <View style={styles.customTimeContainer}>
            <TextInput
              style={styles.customTimeInput}
              placeholder="Custom (minutes)"
              placeholderTextColor="#A0A0A0"
              value={customTime}
              onChangeText={(text) => {
                setCustomTime(text);
                setSelectedTime(null);
              }}
              keyboardType="numeric"
            />
            <Text style={styles.minutesText}>minutes</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!selectedTime && !customTime.trim()) && styles.nextButtonDisabled,
            ]}
            onPress={handleTimeNext}
            disabled={!selectedTime && !customTime.trim()}>
            <Text style={styles.nextButtonText}>Submit</Text>
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 3: Submitting
  if (step === 'submitting') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#5213FE" />
          <Text style={styles.submittingText}>Submitting your activity...</Text>
        </View>
      </View>
    );
  }

  // Step 4: Success
  if (step === 'success') {
    const activity = customActivity.trim() || selectedActivity;
    const timeMinutes = selectedTime || parseInt(customTime.trim(), 10);
    const timeLabel = TIME_OPTIONS.find((opt) => opt.value === timeMinutes)?.label || `${timeMinutes} minutes`;

    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.resultTitle}>Success!</Text>
          <Text style={styles.resultMessage}>
            Your activity &quot;{activity}&quot; has been added for {timeLabel} today!
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.mapButton} onPress={handleViewMap}>
              <MaterialIcons name="map" size={20} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>View Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
              <Text style={styles.quitButtonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Step 5: Failed
  if (step === 'failed') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.failedIcon}>
            <MaterialIcons name="error" size={80} color="#F44336" />
          </View>
          <Text style={styles.resultTitle}>Failed</Text>
          <Text style={styles.resultMessage}>
            Sorry, we couldn&apos;t add your activity. Please try again later.
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={() => setStep('activity')}>
              <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
              <Text style={styles.quitButtonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1C39',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2540',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5213FE',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  activityButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#2A2540',
    borderWidth: 2,
    borderColor: '#3A3450',
  },
  activityButtonSelected: {
    backgroundColor: '#5213FE',
    borderColor: '#5213FE',
  },
  activityButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activityButtonTextSelected: {
    color: '#FFFFFF',
  },
  orText: {
    color: '#A0A0A0',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3450',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#2A2540',
    borderWidth: 2,
    borderColor: '#3A3450',
  },
  timeButtonSelected: {
    backgroundColor: '#5213FE',
    borderColor: '#5213FE',
  },
  timeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timeButtonTextSelected: {
    color: '#FFFFFF',
  },
  customTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customTimeInput: {
    flex: 1,
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3450',
  },
  minutesText: {
    color: '#A0A0A0',
    fontSize: 16,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#1F1C39',
    borderTopWidth: 1,
    borderTopColor: '#2A2540',
  },
  nextButton: {
    backgroundColor: '#5213FE',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#372471',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  submittingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  failedIcon: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  actionButtons: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  mapButton: {
    backgroundColor: '#5213FE',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#372471',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#5213FE',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#372471',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: '#2A2540',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3450',
  },
  quitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  images: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  activityImage: {
    width: 300,
    height: 100,
    alignSelf: 'center',
  },
});
