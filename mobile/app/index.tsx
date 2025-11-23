import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

const newLoader = require('@/assets/images/loader.gif');

export default function SplashScreen() {
  const router = useRouter();
  const colors = Colors.dark;

  useEffect(() => {

    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('@/assets/images/pickMeLogo.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <Image
        source={newLoader}
        style={styles.customLoader}
        contentFit="contain"
      />
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
  customLoader: {
    width: 80, 
    height: 80,
    marginTop: 20,
  },
});

