import { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const colors = Colors.light;

  useEffect(() => {

    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <ActivityIndicator size="large" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

