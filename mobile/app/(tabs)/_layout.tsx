import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';

const TabLabel = ({ focused, label }: { focused: boolean; label: string }) => {
  if (!focused) {
    return null;
  }
  return (
    <View style={{ zIndex: 20 }}>
      <Text style={styles.tabLabel}>{label}</Text>
    </View>
  );
};

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const iconColor = focused ? '#FFFFFF' : '#1F1C39';
  const iconSize = 24;
  const iconSizeFocus = 50;

  if (focused) {
    return (
      <View style={styles.activeIconContainer}>
        <View style={styles.activeIconInner}>
          <MaterialIcons name={name as any} size={iconSizeFocus} color={iconColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ zIndex: 15 }}>
      <MaterialIcons name={name as any} size={iconSize} color={iconColor} />
    </View>
  );
};

const AnimatedIndicator = ({ activeIndex }: { activeIndex: number }) => {
  const { width } = useWindowDimensions();
  const tabWidth = width / 3;
  const translateX = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    translateX.value = withTiming(activeIndex * tabWidth, {
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [activeIndex, tabWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value + (tabWidth - 80) / 2 }],
    };
  });

  return (
    <Animated.View style={[styles.animatedIndicator, animatedStyle]} />
  );
};

export default function TabLayout() {
  const pathname = usePathname();
  const activeIndex = React.useMemo(() => {
    if (pathname.includes('/home')) return 0;
    if (pathname.includes('/map')) return 1;
    if (pathname.includes('/profile')) return 2;
    return 0;
  }, [pathname]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#1F1C39',
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#500FD8',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 0,
            position: 'relative',
            zIndex: 15,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarItemStyle: {
            paddingTop: 8,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label="Home" />
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label="Map" />
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon name="map" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'profile',
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label="profile" />
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon name="account-circle" focused={focused} />
            ),
          }}
        />
      </Tabs>
      <View style={styles.indicatorContainer}>
        <AnimatedIndicator activeIndex={activeIndex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 80,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    overflow: 'visible',
    zIndex: 25,
    elevation: 5,
  },
  activeIconInner: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginTop: -10,
    zIndex: 20,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    pointerEvents: 'none',
    zIndex: 1,
  },
  animatedIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#500FD8',
    position: 'absolute',
    bottom: 20,
    left: 0,
  },
});
