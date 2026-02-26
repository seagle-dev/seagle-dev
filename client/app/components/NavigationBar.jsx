import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = useMemo(() => ([
    { name: 'Home', icon: 'home', href: '/tabs' },                 // app/tabs/index.jsx
    { name: 'Library', icon: 'book', href: '/tabs' },              // change when you create /tabs/library
    { name: 'Classroom', icon: 'school', href: '/tabs' },          // change when you create /tabs/classroom
    { name: 'Quizzes', icon: 'bulb', href: '/tabs' },              // change when you create /tabs/quizzes
    { name: 'Slides', icon: 'easel', href: '/tabs' },              // change when you create /tabs/slides
  ]), []);

  const activeIndex = useMemo(() => {
    // Highlight Home for /tabs and any nested route under /tabs that you decide
    if (pathname === '/tabs' || pathname === '/tabs/index') return 0;
    // If you later add routes: /tabs/library, /tabs/quizzes, etc map them here.
    return 0;
  }, [pathname]);

  const itemWidth = width / tabs.length;
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * itemWidth,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeIndex, itemWidth, indicatorPosition]);

  return (
    <View style={styles.navigationBar}>
      <Animated.View
        style={[
          styles.activeIndicator,
          { width: itemWidth, transform: [{ translateX: indicatorPosition }] },
        ]}
      />
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.navItem}
          onPress={() => router.push(tab.href)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={tab.icon}
            size={26}
            color={activeIndex === index ? '#FFFFFF' : '#8B93C7'}
          />
          <Text style={[styles.navLabel, activeIndex === index && styles.navLabelActive]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1F5C',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 16 },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B93C7',
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});
