import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handlePickPress = () => {
    // Navigate to map tab
    router.push('/(tabs)/map');
  };

  const handlePickMePress = () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      // Navigate to auth screen
      router.push('/auth');
    } else {
      // Navigate to add activity screen
      router.push('/add-activity');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handlePickPress}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Pick</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handlePickMePress}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Pick Me</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1C39',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    backgroundColor: '#5213FE',
    ...Platform.select({
      ios: {
        shadowColor: '#372471',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

